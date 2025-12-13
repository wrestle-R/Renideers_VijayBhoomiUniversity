const Groq = require('groq-sdk');
const Trek = require('../models/Trekk');
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

// Programmatic helper used by other controllers. Returns itinerary string.
exports.optimizeItineraryInternal = async (treks = [], startDate = 'ASAP', duration = 3) => {
  const safeTreks = Array.isArray(treks) ? treks.slice(0, 12) : (typeof treks === 'string' ? treks.split(',').map(s => s.trim()).slice(0,12) : []);
  const prompt = `I want to do these treks: ${safeTreks.join(', ')} starting ${startDate} for ${duration} days. Suggest an optimized itinerary order with rest days.`;
  const itinerary = await callGroq('You are a logistics expert.', prompt);
  return itinerary;
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

// 6. AI Profile Analysis
exports.analyzeProfile = async (req, res) => {
  try {
    const { activities, userProfile } = req.body;
    
    // Prepare data for AI
    const activitySummary = activities.map(a => ({
      title: a.title,
      date: a.startTime,
      distance: a.summary?.totalDistance,
      duration: a.summary?.duration,
      calories: a.summary?.caloriesBurned
    })).slice(0, 20); // Limit to last 20 activities to avoid token limits

    const prompt = `
      Analyze this user's fitness profile based on their recent activities:
      ${JSON.stringify(activitySummary)}
      
      User Profile Context: ${JSON.stringify(userProfile || {})}

      Provide a comprehensive analysis including:
      1. Fitness Level Assessment
      2. Consistency Score (1-10)
      3. Key Strengths
      4. Areas for Improvement
      5. Personalized Training Advice
      
      Format the response as JSON with keys: "fitnessLevel", "consistencyScore", "strengths", "improvements", "advice".
      Keep the tone encouraging but professional.
    `;

    const response = await callGroq("You are an expert fitness coach and data analyst.", prompt);
    
    // Clean up response to ensure valid JSON
    const jsonStr = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
    const analysis = JSON.parse(jsonStr);
    
    res.json(analysis);
  } catch (error) {
    console.error("AI Profile Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze profile" });
  }
};

/**
 * Programmatic helper to generate an itinerary string using the AI pipeline.
 * This is exported so other controllers (WhatsApp webhook) can reuse it.
 * Limits treks to a safe number to avoid excessively long prompts.
 */
exports.generateItinerary = async (treks = [], startDate = 'ASAP', duration = 3) => {
  const safeTreks = Array.isArray(treks)
    ? treks.slice(0, 12)
    : (typeof treks === 'string' ? treks.split(',').map(s => s.trim()).slice(0, 12) : []);

  const prompt = `I want to do these treks: ${safeTreks.join(', ')} starting ${startDate} for ${duration} days. Suggest an optimized itinerary order with rest days.`;
  const itinerary = await callGroq('You are a logistics expert.', prompt);
  console.log(itinerary)
  return itinerary;
};

// 7. AI Consistency Suggestions
exports.getConsistencySuggestions = async (req, res) => {
  try {
    const { consistencyStatus, activities, userProfile } = req.body;
    
    // Prepare activity data
    const lastActivity = activities.length > 0 ? new Date(activities[0].startTime) : null;
    const daysSinceLast = lastActivity ? Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24)) : 999;
    
    const activityCount = activities.length;
    const totalDistance = activities.reduce((sum, a) => sum + (a.summary?.totalDistance || 0), 0);
    const avgDistance = activityCount > 0 ? (totalDistance / 1000 / activityCount).toFixed(1) : 0;

    const prompt = `
      A fitness enthusiast's consistency status is: "${consistencyStatus}"
      - Days since last activity: ${daysSinceLast}
      - Total activities: ${activityCount}
      - Average distance per activity: ${avgDistance} km
      - User name: ${userProfile?.fullName || 'Friend'}
      
      Provide personalized, motivational suggestions to improve their workout consistency. Include:
      1. Why consistency matters for their fitness goals - provide a clear, single sentence or short paragraph
      2. 3-4 specific, actionable tips they can implement this week - each tip should be a simple string describing the action
      3. A motivational message tailored to their current status - provide an encouraging message as a simple string
      
      Be encouraging, specific, and practical. Format as JSON with keys: "importance" (string), "tips" (array of strings only, no objects), "motivation" (string).
      Example: {"importance": "Consistency builds momentum...", "tips": ["Tip 1 description", "Tip 2 description"], "motivation": "You got this!"}
    `;

    const response = await callGroq(
      "You are an experienced fitness coach specializing in motivation and habit formation.",
      prompt
    );
    
    // Clean up response to ensure valid JSON
    const jsonStr = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
    let suggestions = JSON.parse(jsonStr);
    
    // Normalize the response to ensure consistency in format
    // Extract just the strings if the AI returns objects
    if (suggestions.importance && typeof suggestions.importance === 'object') {
      suggestions.importance = suggestions.importance.description || JSON.stringify(suggestions.importance);
    }
    
    if (suggestions.tips && Array.isArray(suggestions.tips)) {
      suggestions.tips = suggestions.tips.map(tip => {
        if (typeof tip === 'string') return tip;
        if (typeof tip === 'object' && tip.description) return tip.description;
        return JSON.stringify(tip);
      });
    }
    
    if (suggestions.motivation && typeof suggestions.motivation === 'object') {
      suggestions.motivation = suggestions.motivation.message || JSON.stringify(suggestions.motivation);
    }
    
    res.json(suggestions);
  } catch (error) {
    console.error("AI Consistency Suggestions Error:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
};