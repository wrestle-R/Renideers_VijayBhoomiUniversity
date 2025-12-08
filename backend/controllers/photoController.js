// controllers/photoController.js
require('dotenv').config();
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

if (!GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY is not set in .env file');
  console.error('Please add GEMINI_API_KEY=your-key-here to your .env file');
} else {
  console.log('GEMINI_API_KEY loaded successfully');
  console.log(`Key starts with: ${GEMINI_API_KEY.substring(0, 10)}...`);
}

function parseJsonFromGemini(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ---------- CONTROLLERS ----------

exports.testAI = async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'GEMINI_API_KEY not configured in .env file',
    });
  }

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Say "API is working" in JSON format: {"status": "working"}',
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 50 },
    };

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({
        status: 'error',
        message: 'AI API returned error',
        statusCode: response.status,
        error: errText.substring(0, 200),
      });
    }

    return res.json({
      status: 'success',
      message: 'AI API is configured correctly and responding',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

exports.identifySpecies = async (req, res) => {
  try {
    console.log('🔍 Identify species request received');

    if (!GEMINI_API_KEY) {
      console.error('AI API key not configured');
      return res.status(500).json({
        error: 'AI service not configured',
        species: 'unknown',
        category: 'unknown',
        confidence: 'low',
        isDangerous: false,
        dangerLevel: 'none',
      });
    }

    const { base64Image } = req.body;
    if (!base64Image) {
      console.error('No base64Image in request body');
      return res.status(400).json({ error: 'base64Image is required' });
    }

    console.log('Sending request to Gemini API...');

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert wildlife and plant identification assistant for trekkers and hikers.

Analyze this image carefully and identify any visible plant, animal, insect, bird, reptile, or landmark.

Respond ONLY with a valid JSON object (no markdown, no backticks, no additional text):

{
  "species": "Common Name (Scientific Name)",
  "category": "plant" or "animal" or "insect" or "reptile" or "bird" or "mammal" or "unknown",
  "confidence": "high" or "medium" or "low",
  "isDangerous": true or false,
  "dangerLevel": "high" or "medium" or "low" or "none"
}

Be specific with the species name. If you can identify it, provide both common and scientific names.
If you cannot identify with confidence, set species to "unknown" and confidence to "low".
For dangerous species, set isDangerous to true and specify the danger level.`,
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status);

      try {
        const errorJson = JSON.parse(errText);
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Raw error text:', errText.substring(0, 500));
      }

      return res.status(500).json({
        error: 'AI service temporarily unavailable',
        species: 'unknown',
        category: 'unknown',
        confidence: 'low',
        isDangerous: false,
        dangerLevel: 'none',
        debugInfo: {
          statusCode: response.status,
          statusText: response.statusText,
        },
      });
    }

    const data = await response.json();
    console.log('Gemini response received');

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('No text in Gemini response');
      return res.status(500).json({
        error: 'No response from AI',
        species: 'unknown',
        category: 'unknown',
        confidence: 'low',
        isDangerous: false,
        dangerLevel: 'none',
      });
    }

    console.log('Raw Gemini response:', text);

    try {
      const json = parseJsonFromGemini(text);
      console.log('Parsed JSON:', json);
      return res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text was:', text);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        species: 'unknown',
        category: 'unknown',
        confidence: 'low',
        isDangerous: false,
        dangerLevel: 'none',
      });
    }
  } catch (err) {
    console.error('identify-species controller error:', err);
    return res.status(500).json({
      error: 'Failed to identify species',
      details: err.message,
    });
  }
};

exports.getSpeciesDetails = async (req, res) => {
  try {
    console.log('Species details request received');

    if (!GEMINI_API_KEY) {
      console.error('AI API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const { speciesName } = req.body;
    if (!speciesName) {
      console.error('No speciesName in request body');
      return res.status(400).json({ error: 'speciesName is required' });
    }

    console.log('Getting details for:', speciesName);

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Provide detailed, accurate information about this species: "${speciesName}"

Respond ONLY with a valid JSON object (no markdown, no backticks, no additional text):

{
  "scientificName": "scientific name if known",
  "commonNames": ["array of common names in different regions"],
  "description": "detailed physical description and key identifying features",
  "habitat": "typical habitat and environmental preferences",
  "distribution": "geographical distribution, especially in India and South Asia",
  "behavior": "behavioral characteristics and activity patterns",
  "diet": "diet for animals OR growing conditions for plants",
  "conservation": "conservation status (IUCN if applicable) and threats",
  "dangerInfo": "detailed safety information - level of danger, what makes it dangerous, symptoms of envenomation/poisoning",
  "interestingFacts": ["3-5 interesting and educational facts"],
  "safetyTips": ["3-5 specific safety tips for trekkers encountering this species"],
  "isThreatened": true or false,
  "isVenomous": true or false,
  "isPoisonous": true or false
}

Be accurate and thorough. If certain information is not applicable, use empty strings or arrays.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      },
    };

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API error:', response.status, errText);
      return res.status(500).json({
        error: 'AI service temporarily unavailable',
        description: 'Unable to retrieve species information',
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    console.log('Raw Gemini response (truncated):', text.substring(0, 200));

    try {
      const json = parseJsonFromGemini(text);
      console.log('Species details parsed successfully');
      return res.json(json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        description: 'Unable to retrieve species information',
      });
    }
  } catch (err) {
    console.error('species-details controller error:', err);
    return res.status(500).json({
      error: 'Failed to get species details',
      details: err.message,
    });
  }
};
