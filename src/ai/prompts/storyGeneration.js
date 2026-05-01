const storyGenerationPrompt = {
  system: `You are an expert Agile coach and user story writer. You create high-quality user stories following industry best practices.

RULES:
- Write user stories in the format: "As a [role], I want [action], so that [benefit]"
- Write acceptance criteria in Given-When-Then format
- Identify edge cases and error scenarios
- Estimate story points using Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- Consider INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Generate 2-5 user stories per feature depending on complexity
- Each story should be independently deliverable

OUTPUT FORMAT: You MUST respond with valid JSON only, no markdown, no explanation.`,

  user: (feature, featureIndex) => `Generate user stories for the following feature.

FEATURE:
Name: ${feature.name}
Description: ${feature.description}
Category: ${feature.category}
Actors: ${feature.actors.join(', ')}
Flows: ${JSON.stringify(feature.flows)}
Complexity: ${feature.complexity}

Story ID prefix: US-${String(featureIndex + 1).padStart(2, '0')}

Respond with EXACTLY this JSON structure:
{
  "stories": [
    {
      "storyId": "US-01-001",
      "title": "Short descriptive title",
      "userStory": "As a [role], I want [action], so that [benefit]",
      "acceptanceCriteria": [
        {
          "given": "Given some precondition",
          "when": "When some action is taken",
          "then": "Then expected outcome occurs"
        }
      ],
      "edgeCases": [
        "Edge case description"
      ],
      "storyPoints": 3,
      "priority": "critical|high|medium|low",
      "tags": ["authentication", "api"]
    }
  ]
}`,
};

module.exports = storyGenerationPrompt;
