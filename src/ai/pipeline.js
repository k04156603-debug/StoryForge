const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const { withRetry } = require('./retry');
const { validateJsonResponse, validateFeatures, validateStories, validateQualityIssues, validateDependencyGraph } = require('./validators/responseValidator');
const featureExtractionPrompt = require('./prompts/featureExtraction');
const storyGenerationPrompt = require('./prompts/storyGeneration');
const qualityAnalysisPrompt = require('./prompts/qualityAnalysis');
const dependencyMappingPrompt = require('./prompts/dependencyMapping');

const openaiConfig = { apiKey: config.openai.apiKey };
if (config.openai.baseUrl) {
  openaiConfig.baseURL = config.openai.baseUrl;
}

// Add 120 second timeout to handle large PRD analysis
openaiConfig.timeout = 120000;
openaiConfig.maxRetries = 0; // we handle retries ourselves

const openai = new OpenAI(openaiConfig);

/**
 * Call OpenAI with structured prompts
 */
const callAI = async (systemPrompt, userPrompt, options = {}) => {
  logger.info(`Calling AI model: ${options.model || config.openai.model}`);
  console.log(`[AI DEBUG] Sending request to model: ${options.model || config.openai.model}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: options.model || config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens || 4096,
      response_format: { type: 'json_object' },
    }, {
      headers: {
        'HTTP-Referer': config.frontendUrl || 'http://localhost:5173',
        'X-Title': 'Story Forge',
      }
    });

    console.log(`[AI DEBUG] Response received for stage. Length: ${response.choices[0].message.content.length}`);
    logger.info(`AI call successful, tokens used: ${response.usage?.total_tokens}`);
    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`AI call failed: ${error.message}`, { status: error.status, code: error.code });
    throw error;
  }
};

/**
 * Stage 1: Extract features from PRD content
 */
const extractFeatures = async (prdContent) => {
  logger.info('AI Pipeline: Starting feature extraction');
  console.log(`[AI DEBUG] Starting feature extraction. Content length: ${prdContent?.length || 0} chars`);

  const result = await withRetry(
    async () => {
      const response = await callAI(
        featureExtractionPrompt.system,
        featureExtractionPrompt.user(prdContent),
        { 
          maxTokens: 4096,
          temperature: 0.2 // Lower temperature for more stable extraction
        }
      );
      const parsed = validateJsonResponse(response, ['features']);
      return validateFeatures(parsed);
    },
    { context: 'Feature Extraction', maxRetries: 15 }
  );

  logger.info(`AI Pipeline: Extracted ${result.features.length} features`);
  return result;
};

/**
 * Stage 2: Generate user stories for each feature
 */
const generateStories = async (features) => {
  logger.info(`AI Pipeline: Generating stories for ${features.length} features`);

  const allStories = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    logger.info(`AI Pipeline: Generating stories for feature ${i + 1}/${features.length}: ${feature.name}`);
    const result = await withRetry(
      async () => {
        const response = await callAI(
          storyGenerationPrompt.system,
          storyGenerationPrompt.user(feature),
          { maxTokens: 4096 }
        );
        const parsed = validateJsonResponse(response, ['stories']);
        return validateStories(parsed);
      },
      { context: `Story Generation (${feature.name})`, maxRetries: 15 }
    );
    result.stories.forEach((story) => {
      story.featureName = feature.name;
    });
 
    allStories.push(...result.stories);
 
    // Add 10s breather to avoid hitting Groq's TPM limit (Free tier is only 6k TPM)
    if (i < features.length - 1) {
      console.log(`[AI DEBUG] Rate limit breather: Waiting 10 seconds before next feature...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  logger.info(`AI Pipeline: Generated ${allStories.length} total stories`);
  return allStories;
};

/**
 * Stage 3: Analyze requirement quality
 */
const analyzeQuality = async (prdContent, features) => {
  logger.info('AI Pipeline: Starting quality analysis');

  const result = await withRetry(
    async () => {
      const response = await callAI(
        qualityAnalysisPrompt.system,
        qualityAnalysisPrompt.user(prdContent, features),
        { maxTokens: 4096 }
      );
      const parsed = validateJsonResponse(response, ['issues']);
      return validateQualityIssues(parsed);
    },
    { context: 'Quality Analysis', maxRetries: 15 }
  );

  logger.info(`AI Pipeline: Found ${result.issues.length} quality issues`);
  return result;
};

/**
 * Stage 4: Map dependencies between stories
 */
const mapDependencies = async (stories) => {
  logger.info('AI Pipeline: Mapping dependencies');

  const result = await withRetry(
    async () => {
      const response = await callAI(
        dependencyMappingPrompt.system,
        dependencyMappingPrompt.user(stories),
        { maxTokens: 4096 }
      );
      const parsed = validateJsonResponse(response, ['nodes', 'edges']);
      return validateDependencyGraph(parsed);
    },
    { context: 'Dependency Mapping', maxRetries: 15 }
  );

  logger.info(`AI Pipeline: Mapped ${result.nodes.length} nodes, ${result.edges.length} edges`);
  return result;
};

/**
 * Run the full AI pipeline
 */
const runFullPipeline = async (prdContent, onProgress) => {
  const progress = onProgress || (() => {});

  progress(10, 'Extracting features from PRD...');
  const featureData = await extractFeatures(prdContent);

  progress(30, 'Generating user stories...');
  const stories = await generateStories(featureData.features);

  progress(60, 'Analyzing requirement quality...');
  const qualityData = await analyzeQuality(prdContent, featureData.features);

  progress(80, 'Mapping dependencies...');
  const dependencyData = await mapDependencies(stories);

  progress(95, 'Finalizing results...');

  return {
    features: featureData.features,
    globalActors: featureData.globalActors,
    productOverview: featureData.productOverview,
    stories,
    qualityIssues: qualityData.issues,
    qualityScore: qualityData.overallScore,
    qualitySummary: qualityData.summary,
    dependencies: dependencyData,
  };
};

module.exports = {
  extractFeatures,
  generateStories,
  analyzeQuality,
  mapDependencies,
  runFullPipeline,
};