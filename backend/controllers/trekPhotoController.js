// controllers/trekPhotoController.js
require('dotenv').config();
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

if (!GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY is not set in .env file');
  console.error('Please add GEMINI_API_KEY=your-key-here to your .env file');
} else {
  console.log('GEMINI_API_KEY loaded successfully');
  console.log(`Key starts with: ${GEMINI_API_KEY.substring(0, 10)}...`);
}

function extractJsonText(text) {
  if (!text || typeof text !== 'string') return null;
  // Remove markdown fences
  let clean = text.replace(/```json|```/g, '').trim();

  // Try to find the first JSON object by locating first '{' and the matching '}'
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  return clean;
}

function parseJsonFromGemini(text) {
  const jsonText = extractJsonText(text);
  if (!jsonText) throw new Error('No JSON-like content found');

  // Try direct parse
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    // Attempt to repair common issues: single quotes, trailing commas
    let repaired = jsonText.replace(/\n/g, ' ')
      .replace(/\'(?=[^,}]*:)/g, '"')
      .replace(/\'(?=[^,}]*,)/g, '"')
      .replace(/,(\s*[}\]])/g, '$1');

    // Replace unquoted keys with quoted keys: { key: -> { "key":
    repaired = repaired.replace(/([{,\s])(\w+)\s*:/g, '$1"$2":');

    try {
      return JSON.parse(repaired);
    } catch (err2) {
      // Give up and rethrow original error for upstream handling
      throw new Error('Failed to parse JSON from AI response');
    }
  }
}

function normalizeIdentification(obj) {
  const out = Object.assign({}, obj);

  // species
  out.species = out.species || 'unknown';

  // category normalization
  if (out.category) {
    out.category = String(out.category).toLowerCase();
    const allowed = ['plant','animal','insect','reptile','bird','mammal','fungus','landmark','unknown'];
    if (!allowed.includes(out.category)) out.category = 'unknown';
  } else {
    out.category = 'unknown';
  }

  // confidence: accept numeric or string like "92%" or "high"
  let score = 0.0;
  const conf = out.confidence || out.confidenceScore;
  
  if (conf != null) {
    if (typeof conf === 'number') {
      score = parseFloat(conf) || 0.0;
    } else if (typeof conf === 'string') {
      const s = conf.trim();
      // percent value like "92%"
      const pct = s.match(/([0-9]{1,3}(?:\.[0-9]+)?)\s*%/);
      if (pct) {
        score = parseFloat(pct[1]) / 100.0;
      } else if (/^[0-9]+(\.[0-9]+)?$/.test(s)) {
        // numeric string
        score = parseFloat(s) || 0.0;
      } else if (/high|medium|low/i.test(s)) {
        const label = s.toLowerCase();
        score = label === 'high' ? 0.9 : label === 'medium' ? 0.6 : label === 'low' ? 0.3 : 0.0;
      }
    }
  }

  // clamp and normalize to 0-1 range
  if (isNaN(score) || score == null) {
    score = 0.0;
  } else if (score > 1) {
    score = score > 100 ? 1.0 : score / 100.0;
  }
  score = Math.max(0.0, Math.min(1.0, score));

  out.confidenceScore = score; // numeric 0-1
  out.confidence = (out.confidence && typeof out.confidence === 'string') ? out.confidence :
    (score >= 0.8 ? 'high' : score >= 0.5 ? 'medium' : score >= 0.2 ? 'low' : 'low');

  // isDangerous normalization
  if (typeof out.isDangerous === 'string') {
    const v = out.isDangerous.toLowerCase();
    out.isDangerous = v === 'true' || v === 'yes' || v === 'y';
  } else {
    out.isDangerous = Boolean(out.isDangerous);
  }

  // dangerLevel normalization
  if (out.dangerLevel) {
    const d = String(out.dangerLevel).toLowerCase();
    if (['high','medium','low','none'].includes(d)) out.dangerLevel = d;
    else out.dangerLevel = 'none';
  } else {
    out.dangerLevel = out.isDangerous ? 'medium' : 'none';
  }

  return out;
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

  Analyze this image carefully and identify any visible plant, animal, insect, bird, reptile, mammal, fungus, or landmark.

  Respond ONLY with a valid JSON object (no markdown, no backticks, no additional text). Use the exact schema below and provide both a numeric confidence score and a textual confidence label. Numeric confidence should be a number between 0 and 1 (e.g. 0.92). Textual confidence should be one of: "high", "medium", "low".

  Return this exact JSON schema:

  {
    "species": "Common Name (Scientific Name)",          // string, use "unknown" if not identifiable
    "category": "plant|animal|insect|reptile|bird|mammal|fungus|landmark|unknown", // one of these strings
    "confidenceScore": 0.0,                               // number between 0 and 1
    "confidence": "high|medium|low",                    // textual label
    "isDangerous": true|false,                            // boolean
    "dangerLevel": "high|medium|low|none"               // one of these strings
  }

  Be specific with the species name; include both common and scientific names when available. If you cannot identify with confidence, set "species" to "unknown" and "confidenceScore" to a low value (e.g. 0.0-0.2) and "confidence" to "low". For dangerous species, set "isDangerous" to true and choose an appropriate "dangerLevel".
  Do not include any additional fields or commentary.`,
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
        console.error('Raw error text:', errText.substring(0, 2000));
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
          // Include a truncated server error response to help diagnose (no secrets)
          serverErrorText: errText ? errText.substring(0, 2000) : null,
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

    console.log('\n========== GEMINI IDENTIFICATION RESPONSE ==========');
    console.log('Raw Gemini response:', text);
    console.log('==================================================\n');

    try {
      const json = parseJsonFromGemini(text);
      console.log('\n✅ Successfully parsed JSON from Gemini');
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
      
      const normalized = normalizeIdentification(json);
      console.log('\n✅ Normalized identification result:');
      console.log('  Species:', normalized.species);
      console.log('  Category:', normalized.category);
      console.log('  Confidence Score:', normalized.confidenceScore, '(numeric 0-1)');
      console.log('  Confidence Label:', normalized.confidence, '(text)');
      console.log('  Is Dangerous:', normalized.isDangerous);
      console.log('  Danger Level:', normalized.dangerLevel);
      console.log('==================================================\n');
      
      return res.json(normalized);
    } catch (parseError) {
      console.error('\n❌ JSON parse error:', parseError.message);
      console.error('Raw text that failed to parse:', text);
      console.error('==================================================\n');
      return res.status(500).json({
        error: 'Failed to parse AI response',
        species: 'unknown',
        category: 'unknown',
        confidence: 'low',
        confidenceScore: 0.0,
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

  Respond ONLY with a valid JSON object (no markdown, no backticks, no additional text). Use the exact schema below. Use arrays for lists and booleans for yes/no fields. If a field is not applicable, return an empty string or an empty array.

  Return this exact JSON schema:

  {
    "scientificName": "string",
    "commonNames": ["string"],
    "description": "string",
    "habitat": "string",
    "distribution": "string",
    "behavior": "string",
    "diet": "string",
    "conservation": "string",
    "dangerInfo": "string",
    "interestingFacts": ["string", "string", "string"],
    "safetyTips": ["string", "string", "string"],
    "isThreatened": true|false,
    "isVenomous": true|false,
    "isPoisonous": true|false
  }

  Be accurate and thorough. Provide region-specific distribution notes (India / South Asia) when applicable.`,
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
        debugInfo: {
          statusCode: response.status,
          statusText: response.statusText,
          serverErrorText: errText ? errText.substring(0, 2000) : null,
        },
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    console.log('\n========== GEMINI SPECIES DETAILS RESPONSE ==========');
    console.log('Species requested:', speciesName);
    console.log('Raw Gemini response:', text);
    console.log('====================================================\n');

    try {
      const json = parseJsonFromGemini(text);
      console.log('\n✅ Successfully parsed species details JSON');
      console.log('Species Details:', JSON.stringify(json, null, 2));
      console.log('\n✅ Details breakdown:');
      console.log('  Scientific Name:', json.scientificName || 'N/A');
      console.log('  Common Names:', json.commonNames?.length || 0, 'names');
      console.log('  Has Description:', !!json.description);
      console.log('  Has Habitat:', !!json.habitat);
      console.log('  Has Distribution:', !!json.distribution);
      console.log('  Has Behavior:', !!json.behavior);
      console.log('  Has Diet:', !!json.diet);
      console.log('  Interesting Facts:', json.interestingFacts?.length || 0, 'facts');
      console.log('  Safety Tips:', json.safetyTips?.length || 0, 'tips');
      console.log('  Is Threatened:', json.isThreatened || false);
      console.log('  Is Venomous:', json.isVenomous || false);
      console.log('  Is Poisonous:', json.isPoisonous || false);
      console.log('====================================================\n');
      return res.json(json);
    } catch (parseError) {
      console.error('\n❌ Species details JSON parse error:', parseError.message);
      console.error('Raw text that failed to parse:', text);
      console.error('====================================================\n');
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
