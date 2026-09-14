import { Router } from 'express';
import { parseVoiceText, parseImageOcr } from '../services/aiService.js';

const router = Router();

router.post('/parse-voice', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ ok: false, error: 'El parámetro "text" es requerido' });
    }

    const parsedData = await parseVoiceText(text);
    return res.json({ ok: true, data: parsedData });
  } catch (error) {
    console.error('[AI Route Voice Error]', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error al procesar voz' });
  }
});

router.post('/parse-image', async (req, res) => {
  try {
    const { image, mediaType } = req.body || {};
    if (!image) {
      return res.status(400).json({ ok: false, error: 'La imagen es requerida' });
    }

    const parsedData = await parseImageOcr(image, mediaType || 'image/jpeg');
    return res.json({ ok: true, data: parsedData });
  } catch (error) {
    console.error('[AI Route Image Error]', error);
    return res.status(500).json({ ok: false, error: error.message || 'Error al procesar imagen' });
  }
});

export default router;
