const Prd = require('../models/Prd');
const Feature = require('../models/Feature');
const UserStory = require('../models/UserStory');
const QualityIssue = require('../models/QualityIssue');
const DependencyGraph = require('../models/DependencyGraph');
const { parseFile, getFileType } = require('./parser.service');
const aiPipeline = require('../ai/pipeline');
const { cleanText, estimateProcessingTime, generateJobId } = require('../utils/helpers');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Create a new PRD from file upload
 */
const createFromFile = async (file, title) => {
  const parsed = await parseFile(file);

  const prd = await Prd.create({
    title: title || file.originalname.replace(/\.[^/.]+$/, ''),
    originalFilename: file.originalname,
    fileType: parsed.fileType,
    rawContent: parsed.content,
    cleanedContent: parsed.content,
    charCount: parsed.content.length,
    status: 'uploaded',
    jobId: generateJobId(),
    metadata: {
      estimatedTime: estimateProcessingTime(parsed.content.length),
    },
  });

  logger.info(`PRD created from file: ${prd._id}`);
  return prd;
};

/**
 * Create a new PRD from pasted content
 */
const createFromPaste = async (content, title) => {
  const cleaned = cleanText(content);

  if (cleaned.length < 50) {
    throw ApiError.badRequest('PRD content is too short. Please provide at least 50 characters.');
  }

  const prd = await Prd.create({
    title: title || `PRD - ${new Date().toLocaleDateString()}`,
    fileType: 'paste',
    rawContent: content,
    cleanedContent: cleaned,
    charCount: cleaned.length,
    status: 'uploaded',
    jobId: generateJobId(),
    metadata: {
      estimatedTime: estimateProcessingTime(cleaned.length),
    },
  });

  logger.info(`PRD created from paste: ${prd._id}`);
  return prd;
};

/**
 * Process a PRD through the AI pipeline
 */
const processPrd = async (prdId) => {
  const prd = await Prd.findById(prdId);
  if (!prd) throw ApiError.notFound('PRD not found');
  if (prd.status === 'completed') throw ApiError.badRequest('PRD already processed');

  const startTime = Date.now();

  try {
    // Update progress helper
    const updateProgress = async (progress, message) => {
      prd.processingProgress = progress;
      prd.processingMessage = message;
      await prd.save();
    };

    // Stage 1: Extract features
    await updateProgress(5, 'Starting AI analysis...');
    prd.status = 'extracting';
    await prd.save();

    const result = await aiPipeline.runFullPipeline(
      prd.cleanedContent,
      async (progress, message) => {
        await updateProgress(progress, message);
      }
    );

    // Stage 2: Save features to DB
    await updateProgress(90, 'Saving results...');
    const savedFeatures = await Feature.insertMany(
      result.features.map((f, i) => ({
        prdId: prd._id,
        name: f.name,
        description: f.description,
        category: f.category || 'core',
        actors: f.actors || [],
        flows: f.flows || [],
        priority: f.priority || 'medium',
        complexity: f.complexity || 'moderate',
        order: i,
      }))
    );

    // Create feature name → id map
    const featureMap = {};
    savedFeatures.forEach((f) => {
      featureMap[f.name] = f._id;
    });

    // Stage 3: Save user stories
    const savedStories = await UserStory.insertMany(
      result.stories.map((s, i) => ({
        prdId: prd._id,
        featureId: featureMap[s.featureName] || savedFeatures[0]._id,
        storyId: s.storyId,
        title: s.title,
        userStory: s.userStory,
        acceptanceCriteria: s.acceptanceCriteria || [],
        edgeCases: s.edgeCases || [],
        storyPoints: s.storyPoints || 3,
        priority: s.priority || 'medium',
        tags: s.tags || [],
        order: i,
      }))
    );

    // Stage 4: Save quality issues
    const savedIssues = await QualityIssue.insertMany(
      result.qualityIssues.map((issue) => ({
        prdId: prd._id,
        issueType: issue.issueType,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        location: issue.location,
        originalText: issue.originalText,
        suggestedFix: issue.suggestedFix,
      }))
    );

    // Stage 5: Save dependency graph with story ObjectId references
    const storyIdMap = {};
    savedStories.forEach((s) => {
      storyIdMap[s.storyId] = s._id;
    });

    await DependencyGraph.create({
      prdId: prd._id,
      nodes: result.dependencies.nodes.map((n) => ({
        id: n.id,
        storyId: storyIdMap[n.id],
        label: n.label,
        featureName: n.featureName,
        storyPoints: n.storyPoints,
        priority: n.priority,
        position: n.position,
      })),
      edges: result.dependencies.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: e.type,
      })),
    });

    // Finalize
    const actualTime = Math.round((Date.now() - startTime) / 1000);
    prd.status = 'completed';
    prd.processingProgress = 100;
    prd.processingMessage = 'Processing complete!';
    prd.metadata = {
      ...prd.metadata,
      actualTime,
      featureCount: savedFeatures.length,
      storyCount: savedStories.length,
      issueCount: savedIssues.length,
    };
    await prd.save();

    logger.info(`PRD ${prdId} processed successfully in ${actualTime}s`);
    return prd;
  } catch (error) {
    prd.status = 'failed';
    prd.error = error.message;
    prd.processingMessage = 'Processing failed';
    await prd.save();
    logger.error(`PRD ${prdId} processing failed:`, error.message);
    throw error;
  }
};

/**
 * Get PRD by ID with processing status
 */
const getPrdById = async (id) => {
  const prd = await Prd.findById(id);
  if (!prd) throw ApiError.notFound('PRD not found');
  return prd;
};

/**
 * Get all PRDs (paginated)
 */
const getAllPrds = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [prds, total] = await Promise.all([
    Prd.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-rawContent -cleanedContent'),
    Prd.countDocuments(),
  ]);
  return { prds, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Delete a PRD and all related data
 */
const deletePrd = async (id) => {
  const prd = await Prd.findById(id);
  if (!prd) throw ApiError.notFound('PRD not found');

  await Promise.all([
    Feature.deleteMany({ prdId: id }),
    UserStory.deleteMany({ prdId: id }),
    QualityIssue.deleteMany({ prdId: id }),
    DependencyGraph.deleteMany({ prdId: id }),
    Prd.findByIdAndDelete(id),
  ]);

  logger.info(`PRD ${id} and all related data deleted`);
  return { deleted: true };
};

module.exports = {
  createFromFile,
  createFromPaste,
  processPrd,
  getPrdById,
  getAllPrds,
  deletePrd,
};
