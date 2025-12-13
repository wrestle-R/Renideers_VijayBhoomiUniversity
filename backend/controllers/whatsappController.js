const { getTwilioClient } = require('../lib/twilioClient');
const aiController = require('./aiController');

/**
 * Incoming WhatsApp webhook from Twilio. Parses a simple message format,
 * calls AI itinerary generator, and replies via WhatsApp using Twilio.
 *
 * Twilio webhook payloads are application/x-www-form-urlencoded.
 */
exports.incoming = async (req, res) => {
  try {
    const from = req.body.From || req.body.from; // expected: 'whatsapp:+1234567890'
    const body = (req.body.Body || req.body.Body || '').toString().trim();

    console.log('WhatsApp webhook:', { from, body });

    if (!from || !body) {
      res.sendStatus(200);
      return;
    }

    // Help keyword
    if (/^help$/i.test(body.trim())) {
      const help = 'Send: TREKS: Trek A, Trek B; START: YYYY-MM-DD; DAYS: N\nOr just send a comma-separated list of treks.';
      await sendWhatsappMessage(from, help);
      return res.sendStatus(200);
    }

    // Parse basic fields - flexible parsing
    const startMatch = body.match(/start\s*[:=]\s*([^;\n]+)/i);
    const daysMatch = body.match(/days\s*[:=]\s*(\d+)/i) || body.match(/duration\s*[:=]\s*(\d+)/i);
    const treksMatch = body.match(/treks\s*[:=]\s*([^;\n]+)/i);

    let treksList = [];
    
    // Method 1: Explicit TREKS: prefix
    if (treksMatch && treksMatch[1]) {
      treksList = treksMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    } 
    // Method 2: If START: exists, everything before START: is the trek(s)
    else if (startMatch) {
      const beforeStart = body.substring(0, body.toLowerCase().indexOf('start')).trim();
      if (beforeStart) {
        // Remove trailing semicolon and split by comma or semicolon
        treksList = beforeStart.replace(/[;,]+$/, '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      }
    }
    // Method 3: Simple comma-separated list (no START/DAYS mentioned)
    else if (body.includes(',') && body.length < 250) {
      treksList = body.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Method 4: Treat entire message as single trek name if it's simple
    else if (body.length > 0 && body.length < 100 && !body.includes(':')) {
      treksList = [body.trim()];
    }

    if (!treksList || treksList.length === 0) {
      await sendWhatsappMessage(from, 'Could not parse treks. Send: Trek Name; START: YYYY-MM-DD; DAYS: N\nOr: TREKS: Trek A, Trek B; START: date; DAYS: N');
      return res.sendStatus(200);
    }

    const startDate = startMatch ? startMatch[1].trim() : 'ASAP';
    const duration = daysMatch ? parseInt(daysMatch[1], 10) : 3;

    // Generate itinerary
    let itinerary;
    try {
      // Use the working optimizer helper
      if (typeof aiController.optimizeItineraryInternal === 'function') {
        itinerary = await aiController.optimizeItineraryInternal(treksList, startDate, duration);
      } else {
        // Fallback to older helper if present
        itinerary = await aiController.generateItinerary ? await aiController.generateItinerary(treksList, startDate, duration) : null;
      }
    } catch (err) {
      console.error('AI generateItinerary error:', err);
      await sendWhatsappMessage(from, 'Sorry, could not generate itinerary right now. Try later.');
      return res.sendStatus(200);
    }

    // Trim long replies to avoid provider limits
    const MAX_WHATSAPP_LENGTH = 1500;
    let truncated = false;
    if (itinerary && itinerary.length > MAX_WHATSAPP_LENGTH) {
      itinerary = itinerary.slice(0, MAX_WHATSAPP_LENGTH - 3) + '...';
      truncated = true;
    }

    const reply = `Your itinerary:\n\n${itinerary}${truncated ? '\n\n(Truncated)' : ''}`;
    await sendWhatsappMessage(from, reply);
    return res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return res.sendStatus(500);
  }
};

async function sendWhatsappMessage(to, text) {
  const config = getTwilioClient();
  if (!config) {
    console.error('Twilio not configured; cannot send WhatsApp message');
    return false;
  }

  const { client, whatsappNumber, phoneNumber } = config;
  // Prefer explicit WhatsApp number from env, otherwise use main phone number
  const rawWhatsApp = whatsappNumber || phoneNumber;
  const from = rawWhatsApp.startsWith('whatsapp:') ? rawWhatsApp : `whatsapp:${rawWhatsApp}`;

  try {
    const msg = await client.messages.create({
      from,
      to, // should be 'whatsapp:+...' as provided by Twilio webhook
      body: text,
    });
    console.log('WhatsApp sent:', msg.sid);
    return true;
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err && err.message);
    return false;
  }
}
