/**
 * Servicio de IA (Anthropic / Claude) para interpretación de voz y OCR de etiquetas
 */

export async function parseVoiceText(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  if (!text || typeof text !== 'string') {
    throw new Error('El texto de voz es requerido');
  }

  // Si no hay API key configurada, utilizamos un parser heurístico local de respaldo
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Service] ANTHROPIC_API_KEY no configurada. Usando parser heurístico de respaldo.');
    return fallbackVoiceParser(text);
  }

  try {
    const prompt = `Extraé datos de precio de supermercado del siguiente texto en español argentino. Respondé ÚNICAMENTE con un objeto JSON válido (sin formato markdown adicional ni explicaciones):
{"local":"","ciudad":"","producto":"","gramaje":"","marca":"","precio":0}

Texto: ${text}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[AI Service Error]', errBody);
      return fallbackVoiceParser(text);
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || '{}';
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('[AI Service Exception]', err);
    return fallbackVoiceParser(text);
  }
}

export async function parseImageOcr(base64Image, mediaType = 'image/jpeg') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  if (!base64Image) {
    throw new Error('La imagen en Base64 es requerida');
  }

  // Limpiar encabezado data:image/...;base64, si viene incluido
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('[AI Service] ANTHROPIC_API_KEY no configurada. Usando mock de OCR de respaldo.');
    return {
      producto: 'Pan de Mesa Blanco',
      gramaje: '500g',
      marca: 'Bimbo',
      precio: 2450.00
    };
  }

  try {
    const prompt = 'Analiza esta etiqueta de precio de supermercado argentino. Respondé ÚNICAMENTE con un JSON válido sin markdown: {"producto":"","gramaje":"","marca":"","precio":0}';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: cleanBase64
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[AI Service Error]', errBody);
      throw new Error('Error al procesar la imagen con el servicio de IA');
    }

    const data = await response.json();
    const rawContent = data.content?.[0]?.text || '{}';
    const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('[AI OCR Exception]', err);
    throw err;
  }
}

function fallbackVoiceParser(text) {
  // Parser de emergencia para extracción básica
  const precioMatch = text.match(/\$?(\d+([.,]\d{1,2})?)/);
  const precio = precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : 0;
  
  return {
    local: '',
    ciudad: '',
    producto: text.substring(0, 40),
    gramaje: '',
    marca: '',
    precio: precio
  };
}
