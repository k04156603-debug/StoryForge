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
const createFromFile = async (file, title, userId) => {
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
    createdBy: userId ? userId.toString() : undefined,
  });

  logger.info(`PRD created from file: ${prd._id}`);
  return prd;
};

/**
 * Create a new PRD from pasted content
 */
const createFromPaste = async (content, title, userId) => {
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
    createdBy: userId ? userId.toString() : undefined,
  });

  logger.info(`PRD created from paste: ${prd._id}`);
  return prd;
};

/**
 * Process a PRD through the AI pipeline
 */
const processPrd = async (prdId) => {
  let prd = await Prd.findById(prdId);
  if (!prd) throw ApiError.notFound('PRD not found');
  if (prd.status === 'completed') return prd;

  const startTime = Date.now();

  try {
    // Helper to update status/progress atomically
    const updateState = async (status, progress, message, extra = {}) => {
      const updateData = {
        status,
        processingProgress: progress,
        processingMessage: message,
        ...extra
      };
      prd = await Prd.findOneAndUpdate(
        { _id: prd._id },
        { $set: updateData },
        { new: true }
      );
    };

    if (prd.status === 'uploaded' || prd.status === 'failed') {
      // Cleanup any previous incomplete run
      await Promise.all([
        Feature.deleteMany({ prdId: prd._id }),
        UserStory.deleteMany({ prdId: prd._id }),
        QualityIssue.deleteMany({ prdId: prd._id }),
        DependencyGraph.deleteMany({ prdId: prd._id }),
      ]);

      // Move to extracting state
      await updateState('extracting', 10, 'Extracting features from PRD...');

      const result = await aiPipeline.extractFeatures(prd.cleanedContent);

      // Save features to DB
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

      // Transition to extracting_done (which triggers story generation)
      await updateState('extracting_done', 30, 'Features extracted.');
      return prd;
    }

    if (prd.status === 'extracting_done') {
      // Lock state to generating
      await updateState('generating', 30, 'Generating stories...');

      const features = await Feature.find({ prdId: prd._id }).sort({ order: 1 });
      const existingStories = await UserStory.find({ prdId: prd._id });
      const completedFeatureIds = new Set(existingStories.map(s => s.featureId.toString()));

      const nextFeature = features.find(f => !completedFeatureIds.has(f._id.toString()));

      if (nextFeature) {
        const completedCount = completedFeatureIds.size + 1;
        const totalCount = features.length;

        await updateState(
          'generating',
          30 + Math.round((25 * (completedCount - 1)) / totalCount),
          `Generating stories for feature: ${nextFeature.name} (${completedCount}/${totalCount})...`
        );

        const result = await aiPipeline.generateStories([nextFeature]);

        // Save user stories for this feature
        await UserStory.insertMany(
          result.map((s, i) => ({
            prdId: prd._id,
            featureId: nextFeature._id,
            storyId: s.storyId,
            title: s.title,
            userStory: s.userStory,
            acceptanceCriteria: s.acceptanceCriteria || [],
            edgeCases: s.edgeCases || [],
            storyPoints: s.storyPoints || 3,
            priority: s.priority || 'medium',
            tags: s.tags || [],
            order: existingStories.length + i,
          }))
        );

        if (completedCount < totalCount) {
          // Still have features left, set status back to extracting_done so client calls process again
          await updateState(
            'extracting_done',
            30 + Math.round((25 * completedCount) / totalCount),
            `Generated stories for ${completedCount}/${totalCount} features.`
          );
        } else {
          // All features done!
          await updateState(
            'generating_done',
            55,
            'All user stories generated.'
          );
        }
      } else {
        // No features or all features already done
        await updateState(
          'generating_done',
          55,
          'All user stories generated.'
        );
      }
      return prd;
    }

    if (prd.status === 'generating_done') {
      await updateState('analyzing', 60, 'Starting quality analysis...');

      const features = await Feature.find({ prdId: prd._id });
      const qualityData = await aiPipeline.analyzeQuality(prd.cleanedContent, features);

      // Save quality issues
      await QualityIssue.insertMany(
        qualityData.issues.map((issue) => ({
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

      // Save quality overallScore, summary to PRD metadata
      const updatedMetadata = {
        ...prd.metadata,
        qualityScore: qualityData.overallScore,
        qualitySummary: qualityData.summary,
      };

      await updateState('analyzing_done', 75, 'Quality analysis complete.', { metadata: updatedMetadata });
      return prd;
    }

    if (prd.status === 'analyzing_done') {
      await updateState('dependencies', 80, 'Mapping dependencies...');

      const features = await Feature.find({ prdId: prd._id });
      const featureMap = {};
      features.forEach((f) => {
        featureMap[f._id.toString()] = f.name;
      });

      const stories = await UserStory.find({ prdId: prd._id }).lean();
      const storiesWithFeatureNames = stories.map((s) => ({
        ...s,
        featureName: featureMap[s.featureId.toString()] || 'Unknown Feature',
      }));

      const dependencyData = await aiPipeline.mapDependencies(storiesWithFeatureNames);

      const storyIdMap = {};
      stories.forEach((s) => {
        storyIdMap[s.storyId] = s._id;
      });

      await DependencyGraph.create({
        prdId: prd._id,
        nodes: dependencyData.nodes.map((n) => ({
          id: n.id,
          storyId: storyIdMap[n.id],
          label: n.label,
          featureName: n.featureName,
          storyPoints: n.storyPoints,
          priority: n.priority,
          position: n.position,
        })),
        edges: dependencyData.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: e.type,
        })),
      });

      // Finalize and calculate actual time
      const actualTime = Math.round((Date.now() - new Date(prd.createdAt).getTime()) / 1000);
      const featureCount = await Feature.countDocuments({ prdId: prd._id });
      const storyCount = await UserStory.countDocuments({ prdId: prd._id });
      const issueCount = await QualityIssue.countDocuments({ prdId: prd._id });

      const updatedMetadata = {
        ...prd.metadata,
        actualTime,
        featureCount,
        storyCount,
        issueCount,
      };

      await updateState('completed', 100, 'Processing complete!', { metadata: updatedMetadata });
      return prd;
    }

    // If it's already in a busy state (e.g. extracting, generating, analyzing, dependencies), do nothing
    return prd;
  } catch (error) {
    logger.error(`PRD ${prdId} processing failed at status ${prd.status}:`, error.message);
    
    if (error.isRetryable) {
      let rollbackStatus = 'uploaded';
      if (prd.status === 'generating') rollbackStatus = 'extracting_done';
      else if (prd.status === 'analyzing') rollbackStatus = 'generating_done';
      else if (prd.status === 'dependencies') rollbackStatus = 'analyzing_done';

      await Prd.updateOne(
        { _id: prd._id },
        {
          $set: {
            status: rollbackStatus,
            processingMessage: `Retryable error: ${error.message}`,
          },
        }
      ).catch((err) => logger.error('Error saving rollback status:', err));
    } else {
      await Prd.updateOne(
        { _id: prd._id },
        {
          $set: {
            status: 'failed',
            error: error.message,
            processingMessage: `Processing failed: ${error.message}`,
          },
        }
      ).catch((err) => logger.error('Error saving failure status:', err));
    }
    throw error;
  }
};

/**
 * Get PRD by ID with processing status
 */
const getPrdById = async (id, userId) => {
  let prd = await Prd.findById(id);
  if (!prd) throw ApiError.notFound('PRD not found');
  if (userId && prd.createdBy && prd.createdBy !== userId.toString()) {
    throw ApiError.forbidden('You do not have access to this PRD');
  }

  // Self-healing: If the PRD has been stuck in a processing status for more than 5 minutes,
  // it means the serverless container timed out or crashed. Mark it as failed.
  const processingStatuses = [
    'uploaded',
    'parsing',
    'extracting',
    'extracting_done',
    'generating',
    'generating_done',
    'analyzing',
    'analyzing_done',
    'dependencies'
  ];
  if (processingStatuses.includes(prd.status)) {
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - new Date(prd.updatedAt).getTime() > staleThreshold) {
      logger.warn(`Self-healing: Marking stale PRD ${prd._id} as failed.`);
      prd.status = 'failed';
      prd.error = 'Processing timed out. Please try again.';
      prd.processingMessage = 'Processing failed';
      await Prd.updateOne(
        { _id: prd._id },
        { 
          $set: { 
            status: 'failed', 
            error: 'Processing timed out. Please try again.',
            processingMessage: 'Processing failed'
          } 
        }
      );
    }
  }

  return prd;
};

/**
 * Get all PRDs (paginated)
 */
const getAllPrds = async (userId, page = 1, limit = 10) => {
  const query = userId ? { createdBy: userId.toString() } : {};
  const skip = (page - 1) * limit;
  const [prds, total] = await Promise.all([
    Prd.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-rawContent -cleanedContent'),
    Prd.countDocuments(query),
  ]);
  return { prds, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Delete a PRD and all related data
 */
const deletePrd = async (id, userId) => {
  const prd = await Prd.findById(id);
  if (!prd) throw ApiError.notFound('PRD not found');
  if (userId && prd.createdBy && prd.createdBy !== userId.toString()) {
    throw ApiError.forbidden('You do not have access to this PRD');
  }

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
