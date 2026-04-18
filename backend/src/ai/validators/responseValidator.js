const logger = require('../../utils/logger');

/**
 * Validate and parse JSON from AI response
 */
const validateJsonResponse = (response, requiredFields = []) => {
  let parsed;

  // Try to extract JSON from the response
  let jsonStr = response.trim();

  // Remove markdown code fences if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  jsonStr = jsonStr.trim();

  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    // Try to find JSON object in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        logger.error('Failed to parse AI response as JSON:', jsonStr.substring(0, 500));
        throw new Error('AI response is not valid JSON');
      }
    } else {
      logger.error('No JSON found in AI response:', jsonStr.substring(0, 500));
      throw new Error('AI response does not contain JSON');
    }
  }

  // Validate required fields
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  return parsed;
};

/**
 * Validate feature extraction response
 */
const validateFeatures = (data) => {
  if (!Array.isArray(data.features)) {
    throw new Error('Features must be an array');
  }
  if (data.features.length === 0) {
    throw new Error('No features extracted from PRD');
  }
  for (const feature of data.features) {
    if (!feature.name || !feature.description) {
      throw new Error('Each feature must have a name and description');
    }
  }
  return data;
};

/**
 * Validate story generation response
 */
const validateStories = (data) => {
  if (!Array.isArray(data.stories)) {
    throw new Error('Stories must be an array');
  }
  for (const story of data.stories) {
    if (!story.storyId || !story.title || !story.userStory) {
      throw new Error('Each story must have storyId, title, and userStory');
    }
  }
  return data;
};

/**
 * Validate quality analysis response
 */
const validateQualityIssues = (data) => {
  if (!Array.isArray(data.issues)) {
    throw new Error('Issues must be an array');
  }
  return data;
};

/**
 * Validate dependency graph response
 */
const validateDependencyGraph = (data) => {
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error('Dependency graph must contain nodes and edges arrays');
  }
  return data;
};

module.exports = {
  validateJsonResponse,
  validateFeatures,
  validateStories,
  validateQualityIssues,
  validateDependencyGraph,
};
