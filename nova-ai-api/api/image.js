import { InferenceClient } from '@huggingface/inference';

const DEFAULT_IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell';
export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.HF_TOKEN) return res.status(503).json({ error: 'الخادم غير مُعد: أضف HF_TOKEN في إعدادات البيئة.' });
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > 2000) return res.status(400).json({ error: 'اكتب وصفًا للصورة بطول يتراوح بين 1 و2000 حرف.' });
  const allowedModels = new Set([DEFAULT_IMAGE_MODEL, 'stabilityai/stable-diffusion-xl-base-1.0']);
  const requested = typeof req.body?.model === 'string' ? req.body.model : DEFAULT_IMAGE_MODEL;
  const model = allowedModels.has(requested) ? requested : (process.env.IMAGE_MODEL || DEFAULT_IMAGE_MODEL);
  try {
    const client = new InferenceClient(process.env.HF_TOKEN, { provider: 'auto' });
    const blob = await client.textToImage({ model, inputs: prompt });
    const mime = blob.type || 'image/png';
    const buffer = Buffer.from(await blob.arrayBuffer());
    if (!mime.startsWith('image/') || buffer.length > 12 * 1024 * 1024) return res.status(502).json({ error: 'استجابة صورة غير صالحة أو أكبر من الحد المسموح.' });
    return res.status(200).json({ image: 'data:' + mime + ';base64,' + buffer.toString('base64'), model });
  } catch (error) {
    const status = Number(error?.status) || 502;
    console.error('NOVA image provider error:', error?.message || 'unknown');
    return res.status(status >= 400 && status < 600 ? status : 502).json({ error: status === 429 ? 'وصلت إلى حد الطلبات أو الرصيد لدى مزوّد الصور.' : 'تعذر توليد الصورة. تحقق من صلاحيات المزوّد وتوفر النموذج.' });
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