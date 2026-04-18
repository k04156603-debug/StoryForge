const UserStory = require('../models/UserStory');
const Feature = require('../models/Feature');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Export stories as CSV
 */
const exportCSV = async (prdId, storyIds) => {
  const query = { prdId };
  if (storyIds && storyIds.length > 0) {
    query._id = { $in: storyIds };
  }

  const stories = await UserStory.find(query)
    .populate('featureId', 'name')
    .sort({ order: 1 });

  if (stories.length === 0) throw ApiError.notFound('No stories found to export');

  const headers = [
    'Story ID', 'Title', 'User Story', 'Feature', 'Priority',
    'Story Points', 'Status', 'Acceptance Criteria', 'Edge Cases', 'Tags'
  ];

  const rows = stories.map((s) => [
    s.storyId,
    `"${s.title.replace(/"/g, '""')}"`,
    `"${s.userStory.replace(/"/g, '""')}"`,
    s.featureId?.name || '',
    s.priority,
    s.storyPoints,
    s.status,
    `"${s.acceptanceCriteria.map((ac) => `Given ${ac.given}, When ${ac.when}, Then ${ac.then}`).join('; ').replace(/"/g, '""')}"`,
    `"${s.edgeCases.join('; ').replace(/"/g, '""')}"`,
    `"${s.tags.join(', ')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  logger.info(`Exported ${stories.length} stories as CSV for PRD ${prdId}`);
  return { content: csv, filename: `stories-${prdId}.csv`, contentType: 'text/csv' };
};

/**
 * Export stories as Markdown
 */
const exportMarkdown = async (prdId, storyIds) => {
  const query = { prdId };
  if (storyIds && storyIds.length > 0) {
    query._id = { $in: storyIds };
  }

  const features = await Feature.find({ prdId }).sort({ order: 1 });
  const stories = await UserStory.find(query).sort({ order: 1 });

  let md = `# User Stories\n\n`;
  md += `*Generated on ${new Date().toISOString().split('T')[0]}*\n\n`;
  md += `---\n\n`;

  for (const feature of features) {
    const featureStories = stories.filter((s) => s.featureId.toString() === feature._id.toString());
    if (featureStories.length === 0) continue;

    md += `## ${feature.name}\n\n`;
    md += `${feature.description}\n\n`;

    for (const story of featureStories) {
      md += `### ${story.storyId}: ${story.title}\n\n`;
      md += `**User Story:** ${story.userStory}\n\n`;
      md += `**Priority:** ${story.priority} | **Points:** ${story.storyPoints}\n\n`;

      if (story.acceptanceCriteria.length > 0) {
        md += `**Acceptance Criteria:**\n\n`;
        story.acceptanceCriteria.forEach((ac, i) => {
          md += `${i + 1}. **Given** ${ac.given}\n   **When** ${ac.when}\n   **Then** ${ac.then}\n\n`;
        });
      }

      if (story.edgeCases.length > 0) {
        md += `**Edge Cases:**\n\n`;
        story.edgeCases.forEach((ec) => {
          md += `- ${ec}\n`;
        });
        md += '\n';
      }

      md += `---\n\n`;
    }
  }

  logger.info(`Exported ${stories.length} stories as Markdown for PRD ${prdId}`);
  return { content: md, filename: `stories-${prdId}.md`, contentType: 'text/markdown' };
};

/**
 * Export stories to Jira (placeholder — requires Jira API config)
 */
const exportJira = async (prdId, storyIds) => {
  const config = require('../config');

  if (!config.jira.baseUrl || !config.jira.apiToken) {
    throw ApiError.badRequest('Jira integration not configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN in .env');
  }

  const query = { prdId };
  if (storyIds && storyIds.length > 0) {
    query._id = { $in: storyIds };
  }

  const stories = await UserStory.find(query)
    .populate('featureId', 'name')
    .sort({ order: 1 });

  if (stories.length === 0) throw ApiError.notFound('No stories found to export');

  // Build Jira ticket payloads
  const tickets = stories.map((story) => ({
    fields: {
      project: { key: config.jira.projectKey },
      summary: `${story.storyId}: ${story.title}`,
      description: buildJiraDescription(story),
      issuetype: { name: 'Story' },
      priority: { name: mapPriority(story.priority) },
      story_points: story.storyPoints,
      labels: story.tags,
    },
  }));

  // In production, use fetch to create Jira issues
  // For now, return the payloads
  logger.info(`Prepared ${tickets.length} Jira tickets for PRD ${prdId}`);
  return {
    tickets,
    message: `${tickets.length} Jira tickets prepared for creation`,
    note: 'Actual Jira API integration requires valid credentials in .env',
  };
};

const buildJiraDescription = (story) => {
  let desc = `h3. User Story\n${story.userStory}\n\n`;

  if (story.acceptanceCriteria.length > 0) {
    desc += `h3. Acceptance Criteria\n`;
    story.acceptanceCriteria.forEach((ac) => {
      desc += `* *Given* ${ac.given}\n** *When* ${ac.when}\n** *Then* ${ac.then}\n`;
    });
    desc += '\n';
  }

  if (story.edgeCases.length > 0) {
    desc += `h3. Edge Cases\n`;
    story.edgeCases.forEach((ec) => {
      desc += `* ${ec}\n`;
    });
  }

  return desc;
};

const mapPriority = (priority) => {
  const map = { critical: 'Highest', high: 'High', medium: 'Medium', low: 'Low' };
  return map[priority] || 'Medium';
};

module.exports = { exportCSV, exportMarkdown, exportJira };
