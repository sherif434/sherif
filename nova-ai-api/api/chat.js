import { InferenceClient } from '@huggingface/inference';

const MAX_MESSAGES = 24;
const MAX_CHARS = 12000;
const DEFAULT_MODEL = 'openai/gpt-oss-120b:fastest';
const SYSTEM_PROMPT = 'You are NOVA, a helpful, honest and security-conscious AI assistant. Reply in the user’s language, usually Arabic. Be clear and practical. For code, provide complete runnable examples when appropriate, explain assumptions, and never claim you executed code or verified facts unless that actually happened. Refuse unsafe requests and ask before consequential actions.';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.HF_TOKEN) return res.status(503).json({ error: 'الخادم غير مُعد: أضف HF_TOKEN في إعدادات البيئة.' });
  try {
    const body = req.body || {};
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: 'messages must be a non-empty array of at most 24 messages.' });
    }
    const messages = body.messages.map((m) => {
      if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > MAX_CHARS) {
        throw new Error('كل رسالة يجب أن تحتوي على role وcontent صالحين.');
      }
      return { role: m.role, content: m.content };
    });
    if (messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'The final message must be from the user.' });
    const model = typeof body.model === 'string' && /^[\w.-]+\/[\w.-]+(?::[\w.-]+)?$/.test(body.model) ? body.model : (process.env.CHAT_MODEL || DEFAULT_MODEL);
    const client = new InferenceClient(process.env.HF_TOKEN, { provider: 'auto' });
    const result = await client.chatCompletion({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1200,
      temperature: 0.65
    });
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) return res.status(502).json({ error: 'أعاد مزوّد النموذج ردًا فارغًا.' });
    return res.status(200).json({ reply, model, usage: result.usage || null });
  } catch (error) {
    const status = Number(error?.status) || 502;
    const safeStatus = status >= 400 && status < 600 ? status : 502;
    console.error('NOVA chat provider error:', error?.message || 'unknown');
    return res.status(safeStatus).json({ error: safeStatus === 401 || safeStatus === 403 ? 'رفض مزوّد الاستدلال بيانات الاعتماد أو الصلاحيات.' : safeStatus === 429 ? 'وصلت إلى حد الطلبات أو الرصيد لدى مزوّد النموذج.' : 'تعذر إكمال طلب النموذج. تحقق من توفر النموذج والمزوّد وسجلات الخادم.' });
  }
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