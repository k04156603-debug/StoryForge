const dependencyMappingPrompt = {
  system: `You are an expert software architect who specializes in analyzing dependencies between user stories and features.

RULES:
- Identify which stories must be completed before others can begin
- Identify shared dependencies (e.g., authentication needed before protected features)
- Mark dependency types: "blocks" (hard dependency), "depends_on" (soft dependency), "related_to" (informational)
- Consider technical dependencies (database, APIs, shared components)
- Consider functional dependencies (user flows, data requirements)
- Generate reasonable x,y positions for graph layout (nodes should be spread out, with dependent nodes below their dependencies)

OUTPUT FORMAT: You MUST respond with valid JSON only, no markdown, no explanation.`,

  user: (stories) => `Analyze the following user stories and identify all dependencies between them.

USER STORIES:
${JSON.stringify(stories.map(s => ({ storyId: s.storyId, title: s.title, featureName: s.featureName, storyPoints: s.storyPoints, priority: s.priority })), null, 2)}

Respond with EXACTLY this JSON structure:
{
  "nodes": [
    {
      "id": "US-01-001",
      "label": "Story title",
      "featureName": "Feature Name",
      "storyPoints": 3,
      "priority": "high",
      "position": { "x": 250, "y": 50 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "US-01-001",
      "target": "US-02-001",
      "label": "requires auth",
      "type": "blocks|depends_on|related_to"
    }
  ]
}`,
};

module.exports = dependencyMappingPrompt;
