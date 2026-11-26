export default function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  return res.status(200).json({
    ok: true,
    service: 'nova-ai-api',
    configured: Boolean(process.env.HF_TOKEN),
    chatModelConfigured: Boolean(process.env.CHAT_MODEL || 'openai/gpt-oss-120b:fastest'),
    imageModelConfigured: Boolean(process.env.IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell')
  });
}
function applyCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}