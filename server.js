require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SUBMISSIONS_PATH = path.join(DATA_DIR, 'contact-submissions.json');
const captchaStore = new Map();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

fs.mkdirSync(DATA_DIR, { recursive: true });

function readLocalEntries() {
  try {
    const raw = fs.readFileSync(SUBMISSIONS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeLocalEntries(entries) {
  fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify(entries, null, 2));
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function cleanExpiredCaptchas() {
  const now = Date.now();
  for (const [token, value] of captchaStore.entries()) {
    if (value.expiresAt < now) {
      captchaStore.delete(token);
    }
  }
}

function createCaptcha() {
  cleanExpiredCaptchas();

  const operations = [
    {
      symbol: '+',
      apply: (a, b) => a + b,
    },
    {
      symbol: '-',
      apply: (a, b) => a - b,
    },
  ];

  const op = operations[Math.floor(Math.random() * operations.length)];
  const left = Math.floor(Math.random() * 9) + 5;
  const right = Math.floor(Math.random() * 9) + 2;
  const answer = op.apply(left, right);
  const token = crypto.randomUUID();
  const question = `${left} ${op.symbol} ${right} = ?`;

  captchaStore.set(token, { answer, expiresAt: Date.now() + 5 * 60 * 1000 });

  return { token, question };
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(ROOT_DIR));

app.get('/api/health', (req, res) => {
  const hasSupabase = Boolean(getSupabaseClient());
  res.json({
    ok: true,
    mode: hasSupabase ? 'supabase' : 'local-file',
    storage: hasSupabase ? 'Supabase' : 'data/contact-submissions.json',
  });
});

app.get('/api/captcha', (req, res) => {
  const captcha = createCaptcha();
  res.json({ ok: true, ...captcha });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, topic, urgency, message, captchaToken, captchaAnswer } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: 'Name, email, and message are required.',
    });
  }

  if (!captchaToken || !captchaAnswer) {
    return res.status(400).json({
      ok: false,
      error: 'Captcha verification is required.',
    });
  }

  const captchaEntry = captchaStore.get(captchaToken);
  if (!captchaEntry) {
    return res.status(400).json({
      ok: false,
      error: 'Captcha expired or invalid. Please try again.',
    });
  }

  const expectedAnswer = Number(captchaEntry.answer);
  const providedAnswer = Number(captchaAnswer);

  captchaStore.delete(captchaToken);

  if (!Number.isFinite(providedAnswer) || providedAnswer !== expectedAnswer) {
    return res.status(400).json({
      ok: false,
      error: 'Captcha failed. Please solve the challenge again.',
    });
  }

  const entry = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim(),
    topic: topic ? String(topic).trim() : 'Unspecified',
    urgency: urgency ? String(urgency).trim() : 'Not urgent',
    message: String(message).trim(),
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            id: entry.id,
            name: entry.name,
            email: entry.email,
            topic: entry.topic,
            urgency: entry.urgency,
            message: entry.message,
            created_at: entry.created_at,
          },
        ]);

      if (!error) {
        return res.status(200).json({
          ok: true,
          destination: 'supabase',
          message: 'Transmission sent to Supabase.',
          id: entry.id,
        });
      }

      throw error;
    } catch (error) {
      console.error('Supabase insert failed, falling back to local file:', error.message);
    }
  }

  const entries = readLocalEntries();
  entries.push(entry);
  writeLocalEntries(entries);

  res.status(200).json({
    ok: true,
    destination: 'local-file',
    message: 'Transmission saved locally. No Supabase config was detected.',
    id: entry.id,
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'contact.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Route not found.' });
  }

  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase: ' + (supabaseUrl && supabaseAnonKey ? 'configured' : 'not configured, using local file storage'));
});
