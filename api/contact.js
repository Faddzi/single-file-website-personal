const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function verifyCaptcha(token, answer) {
  if (typeof token !== 'string' || typeof answer !== 'string') {
    return false;
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.CAPTCHA_SECRET)
    .update(payload)
    .digest();
  let suppliedSignature;

  try {
    suppliedSignature = Buffer.from(signature, 'base64url');
  } catch {
    return false;
  }

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return false;
  }

  try {
    const challenge = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return (
      Number.isFinite(challenge.answer) &&
      Number.isFinite(challenge.expiresAt) &&
      challenge.expiresAt >= Date.now() &&
      Number(answer) === challenge.answer
    );
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!process.env.CAPTCHA_SECRET) {
    return res.status(503).json({
      ok: false,
      error: 'Captcha is not configured on the server.',
    });
  }

  const { name, email, topic, urgency, message, captchaToken, captchaAnswer } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (
    !cleanName ||
    cleanName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanEmail.length > 254 ||
    !cleanMessage ||
    cleanMessage.length > 5000
  ) {
    return res.status(400).json({
      ok: false,
      error: 'Enter a valid name, email, and message (maximum 5,000 characters).',
    });
  }

  if (!verifyCaptcha(captchaToken, captchaAnswer)) {
    return res.status(400).json({
      ok: false,
      error: 'Captcha failed or expired. Please solve the new challenge.',
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({
      ok: false,
      error: 'Contact storage is not configured. Please try again later.',
    });
  }

  const entry = {
    name: cleanName,
    email: cleanEmail,
    topic: typeof topic === 'string' ? topic.trim().slice(0, 120) : 'Unspecified',
    urgency: typeof urgency === 'string' ? urgency.trim().slice(0, 120) : 'Not urgent',
    message: cleanMessage,
  };

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from('contact_submissions').insert(entry);

    if (error) {
      console.error('Supabase contact submission failed:', error.message);
      return res.status(502).json({
        ok: false,
        error: 'The message could not be saved. Please try again later.',
      });
    }

    return res.status(200).json({
      ok: true,
      destination: 'supabase',
      message: 'Transmission sent to Supabase.',
    });
  } catch (error) {
    console.error('Contact submission failed:', error.message);
    return res.status(500).json({
      ok: false,
      error: 'The message could not be saved. Please try again later.',
    });
  }
};
