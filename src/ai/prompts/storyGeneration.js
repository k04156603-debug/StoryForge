const storyGenerationPrompt = {
  system: `Expert Agile Coach. Write high-quality User Stories.
Format: "As a [role], I want [action], so that [benefit]"
Acceptance Criteria: Given-When-Then format.
 Fibonacci story points (1-21).
Generate 1-3 stories per feature. 
Output: Valid JSON only.`,

  user: (feature, featureIndex) => `Feature: ${feature.name}
Desc: ${feature.description}
Actors: ${feature.actors.join(', ')}
JSON Format:
{
  "stories": [
    {
      "storyId": "US-${String(featureIndex + 1).padStart(2, '0')}-001",
      "title": "Title",
      "userStory": "As a [role], I want [action], so that [benefit]",
      "acceptanceCriteria": [{"given": "...", "when": "...", "then": "..."}],
      "edgeCases": ["Case"],
      "storyPoints": 3,
      "priority": "high",
      "tags": ["tag"]
    }
  ]
}`,
};

module.exports = storyGenerationPrompt;
