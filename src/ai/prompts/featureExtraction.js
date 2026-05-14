const featureExtractionPrompt = {
  system: `You are a high-speed requirements engineer. Extract core features, actors, and product overview from PRDs. 
CRITICAL: Respond ONLY with valid JSON. No conversational text.
PRIORITIZE: Accuracy and structural integrity.`,

  user: (prdContent) => `Analyze the following PRD and extract all features into structured JSON.

PRD CONTENT:
${prdContent}

Respond with EXACTLY this JSON structure:
{
  "features": [
    {
      "name": "Feature Name",
      "description": "Detailed description of the feature",
      "category": "core|secondary|nice-to-have|infrastructure",
      "actors": ["User", "Admin"],
      "flows": [
        {
          "name": "Main Flow",
          "steps": ["Step 1", "Step 2", "Step 3"]
        }
      ],
      "priority": "critical|high|medium|low",
      "complexity": "simple|moderate|complex|very-complex"
    }
  ],
  "globalActors": ["User", "Admin", "System"],
  "productOverview": "Brief summary of the product"
}`,
};

module.exports = featureExtractionPrompt;
