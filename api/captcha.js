const crypto = require('crypto');

function createToken(answer, expiresAt) {
  const payload = Buffer.from(JSON.stringify({ answer, expiresAt })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.CAPTCHA_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  if (!process.env.CAPTCHA_SECRET) {
    return res.status(503).json({
      ok: false,
      error: 'Captcha is not configured on the server.',
    });
  }

  const left = crypto.randomInt(8, 15);
  const right = crypto.randomInt(2, 8);
  const operation = Math.random() < 0.5 ? '+' : '-';
  const answer = operation === '+' ? left + right : left - right;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const token = createToken(answer, expiresAt);

  return res.status(200).json({
    ok: true,
    token,
    question: `${left} ${operation} ${right} = ?`,
  });
};
