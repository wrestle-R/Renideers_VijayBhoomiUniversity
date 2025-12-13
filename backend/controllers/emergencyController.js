const twilio = require('twilio');

/**
 * Get Twilio client instance (lazy initialization)
 */
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.error('❌ Missing Twilio credentials:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasPhoneNumber: !!phoneNumber,
    });
    return null;
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log('✅ Twilio client initialized successfully');
    return { client, phoneNumber };
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
    return null;
  }
};

/**
 * Send emergency SOS SMS automatically (no user interaction)
 * 
 * POST /api/emergency/send-sos
 * Body: {
 *   emergencyContacts: [{ name: string, phone: string }],
 *   userName: string,
 *   latitude: number,
 *   longitude: number,
 *   timestamp: string,
 *   triggerType: 'fall' | 'manual'
 * }
 */
exports.sendSOS = async (req, res) => {
  try {
    console.log('📥 Received SOS request:', {
      hasContacts: !!req.body.emergencyContacts,
      contactCount: req.body.emergencyContacts?.length,
      location: req.body.latitude && req.body.longitude ? 'provided' : 'missing',
      triggerType: req.body.triggerType,
    });

    const { emergencyContacts, userName, latitude, longitude, timestamp, triggerType } = req.body;

    // Validate input
    if (!emergencyContacts || !Array.isArray(emergencyContacts) || emergencyContacts.length === 0) {
      console.error('❌ Validation failed: No emergency contacts');
      return res.status(400).json({ 
        success: false, 
        error: 'No emergency contacts provided' 
      });
    }

    if (!latitude || !longitude) {
      console.error('❌ Validation failed: Missing location');
      return res.status(400).json({ 
        success: false, 
        error: 'Location coordinates required' 
      });
    }

    // Initialize Twilio client
    const twilioConfig = getTwilioClient();
    if (!twilioConfig) {
      console.error('❌ Twilio configuration failed');
      return res.status(503).json({ 
        success: false, 
        error: 'SMS service not configured on server' 
      });
    }

    const { client: twilioClient, phoneNumber: fromNumber } = twilioConfig;

    // Build compact SMS message (avoid emojis and long text to stay within trial limits)
    const MAX_SMS_LENGTH = 140; // conservative limit to avoid multi-segment messages on trial accounts
    const triggerText = triggerType === 'fall' ? 'Fall detected' : 'Manual SOS';
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const timeShort = timestamp || new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Compose minimal parts and join with separators to keep message short and clickable
    const namePart = userName ? `Name:${String(userName).trim().slice(0, 30)}` : null;
    const parts = [`SOS ALERT - ${triggerText}`, `Loc:${mapsLink}`, `Time:${timeShort}`];
    if (namePart) parts.push(namePart);

    let message = parts.join(' | ');

    // If message still too long, try removing the name part first
    if (message.length > MAX_SMS_LENGTH && namePart) {
      parts.pop();
      message = parts.join(' | ');
      console.warn('🔧 SMS trimmed: removed Name field to reduce length');
    }

    // Final safety: truncate to MAX_SMS_LENGTH if still too long
    let wasTruncated = false;
    if (message.length > MAX_SMS_LENGTH) {
      message = message.slice(0, MAX_SMS_LENGTH - 3) + '...';
      wasTruncated = true;
      console.warn(`🔧 SMS truncated to ${MAX_SMS_LENGTH} chars`);
    }

    console.log('📱 Preparing to send SMS:', { triggerText, contactCount: emergencyContacts.length, length: message.length, wasTruncated });

    // Filter valid contacts and dedupe by phone number
    const validContacts = emergencyContacts
      .filter(c => {
        const hasPhone = c.phone && c.phone.trim().length > 0;
        if (!hasPhone) console.warn('⚠️ Skipping contact with no phone:', c.name);
        return hasPhone;
      })
      .reduce((acc, c) => {
        const phone = c.phone.trim();
        if (!acc.find(x => x.phone.trim() === phone)) acc.push(c);
        return acc;
      }, []);

    if (validContacts.length === 0) {
      console.error('❌ No valid phone numbers found');
      return res.status(400).json({ 
        success: false, 
        error: 'No valid phone numbers in emergency contacts' 
      });
    }

    console.log(`📤 Sending SMS to ${validContacts.length} unique contact(s)...`);

    // Send SMS to all emergency contacts
    const sendPromises = validContacts.map(contact => {
      const toNumber = contact.phone.trim();
      
      return twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
      })
      .then(msg => {
        console.log(`✅ SMS sent successfully to ${contact.name} (${toNumber}): ${msg.sid}`);
        return { 
          success: true, 
          contact: contact.name,
          phone: toNumber, 
          sid: msg.sid,
          status: msg.status,
        };
      })
      .catch(err => {
        console.error(`❌ Failed to send SMS to ${contact.name} (${toNumber}):`, err.message);
        return { 
          success: false, 
          contact: contact.name,
          phone: toNumber, 
          error: err.message,
          code: err.code,
        };
      });
    });

    // Wait for all SMS sends to complete
    const results = await Promise.all(sendPromises);

    // Analyze results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\n📊 SMS DELIVERY REPORT:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📋 Total attempts: ${results.length}\n`);

    // Log individual results
    results.forEach((result, idx) => {
      if (result.success) {
        console.log(`   ${idx + 1}. ✅ ${result.contact} - Message ID: ${result.sid}`);
      } else {
        console.log(`   ${idx + 1}. ❌ ${result.contact} - Error: ${result.error}`);
      }
    });

    // Return success if at least one SMS was sent
    if (successCount > 0) {
      return res.json({
        success: true,
        message: `SOS sent successfully to ${successCount} of ${results.length} contact(s)`,
        sent: successCount,
        failed: failureCount,
        results,
      });
    } else {
      // All SMS sends failed
      return res.status(500).json({
        success: false,
        error: `Failed to send SMS to all ${results.length} contact(s)`,
        results,
      });
    }

  } catch (error) {
    console.error('\n❌ EMERGENCY SOS ERROR:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
