const Groq = require('groq-sdk');
const Trek = require('../models/Trek');
const UserProfile = require('../models/UserProfiles');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper for Groq calls
async function callGroq(systemPrompt, userPrompt) {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
  });
  return completion.choices[0]?.message?.content || "";
}

// 1. AI Trek Recommendation
exports.getRecommendations = async (req, res) => {
  try {
    const { userId } = req.body;
    // Fetch data (mocking user prefs if profile missing for demo)
    const treks = await Trek.find({}, 'title difficulty location season');
    const trekList = treks.map(t => `${t.title} (${t.difficulty}, ${t.season})`).join(", ");
    
    // In a real app, fetch UserProfile by userId. Using generic prefs for now if not provided.
    const userPrefs = req.body.preferences || "beginner level, likes nature and photography";

    const prompt = `Based on these treks: [${trekList}] and user preferences: "${userPrefs}", recommend top 3 treks. Return ONLY a JSON array of trek titles. Example: ["Trek A", "Trek B"]`;

    const response = await callGroq("You are a trekking guide.", prompt);
    
    // Clean up response to ensure valid JSON
    const jsonStr = response.substring(response.indexOf('['), response.lastIndexOf(']') + 1);
    const recommendedTitles = JSON.parse(jsonStr);
    
    // Fetch full trek objects
    const recommendedTreks = await Trek.find({ title: { $in: recommendedTitles } });
    res.json(recommendedTreks);
  } catch (error) {
    console.error("AI Rec Error:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};

// 2. AI Trek Summary
exports.getTrekSummary = async (req, res) => {
  try {
    const { trekId } = req.body;
    const trek = await Trek.findById(trekId);
    if (!trek) return res.status(404).json({ error: "Trek not found" });

    const prompt = `Generate a catchy, exciting 2-sentence summary for this trek: ${trek.title} in ${trek.location}. Highlights: ${trek.highlights.join(", ")}.`;
    const summary = await callGroq("You are an enthusiastic travel writer.", prompt);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate summary" });
  }
};

// 3. AI Chatbot
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    // Construct context from history
    const messages = [
      { role: "system", content: "You are Trekky AI, a helpful trekking assistant. Keep answers concise and helpful." },
      ...(history || []),
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
    });

    res.json({ reply: completion.choices[0]?.message?.content });
  } catch (error) {
    res.status(500).json({ error: "Chat failed" });
  }
};

// 4. AI Itinerary Optimizer
exports.optimizeItinerary = async (req, res) => {
  try {
    const { treks, startDate, duration } = req.body;
    const prompt = `I want to do these treks: ${treks.join(", ")} starting ${startDate} for ${duration} days. Suggest an optimized itinerary order with rest days.`;
    const itinerary = await callGroq("You are a logistics expert.", prompt);
    res.json({ itinerary });
  } catch (error) {
    res.status(500).json({ error: "Optimization failed" });
  }
};

// 5. AI Difficulty Estimator
exports.estimateDifficulty = async (req, res) => {
  try {
    const { description } = req.body;
    const prompt = `Estimate the difficulty (Easy, Moderate, Difficult) and give 1 tip for a trek described as: "${description}". Return format: "Difficulty: [Level]. Tip: [Tip]"`;
    const estimation = await callGroq("You are a mountaineering expert.", prompt);
    res.json({ estimation });
  } catch (error) {
    res.status(500).json({ error: "Estimation failed" });
  }
};