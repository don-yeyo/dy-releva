import { Router } from 'express';

const router = Router();

// Sincronizar un registro de relevamiento de precio
router.post('/price', async (req, res) => {
  try {
    const record = req.body || {};
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn('[Sync Price] GOOGLE_SCRIPT_URL no configurada. Simulando sincronización exitosa.');
      return res.json({ ok: true, simulated: true, id: record.id });
    }

    // Normalizar precio propio (Precio Pro) y producto propio de referencia
    const precioProValue = record.precioPro !== undefined && record.precioPro !== null && record.precioPro !== ''
      ? Number(record.precioPro)
      : (record.dyPrecio !== undefined && record.dyPrecio !== null && record.dyPrecio !== ''
          ? Number(record.dyPrecio)
          : (record.precioPropio !== undefined ? Number(record.precioPropio) : 0));

    const refDyValue = (record.dyRef || record.refDy || record.prodPropio || record.productoPropio || '').trim();

    const normalizedRecord = {
      ...record,
      dyRef: refDyValue,
      refDy: refDyValue,
      prodPropio: refDyValue,
      productoPropio: refDyValue,
      dyPrecio: precioProValue,
      precioPro: precioProValue,
      precioPropio: precioProValue,
      precio_pro: precioProValue
    };

    console.log(`[Sync Price] Enviando registro #${record.id} a Google Sheets (Precio Pro: $${precioProValue})...`);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(normalizedRecord)
    });

    const respText = await response.text();
    console.log(`[Sync Price] Respuesta de Google Apps Script: status=${response.status}, body=${respText}`);

    return res.json({ ok: true, status: response.status, id: record.id, googleResponse: respText });
  } catch (error) {
    console.error('[Sync Price Error]', error);
    return res.status(500).json({ ok: false, error: 'Error al sincronizar con Google Sheets' });
  }
});

// Sincronizar una novedad de PDV
router.post('/novedad', async (req, res) => {
  try {
    const novedad = req.body;
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn('[Sync Novedad] GOOGLE_SCRIPT_URL no configurada. Simulando sincronización.');
      return res.json({ ok: true, simulated: true, id: novedad.id });
    }

    const params = new URLSearchParams({
      accion: 'novedad',
      fecha: novedad.fecha || '',
      hora: novedad.hora || '',
      usuario: novedad.usuario || '',
      pdv: novedad.pdv || '',
      tipo: novedad.tipo || '',
      comentario: novedad.comentario || ''
    });

    await fetch(`${scriptUrl}?${params.toString()}`);

    // Si incluye foto, subir en segunda llamada
    if (novedad.foto && novedad.foto.length > 50 && novedad.foto.length < 2000000) {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ accion: 'subirFoto', id: String(novedad.id), foto: novedad.foto })
      });
    }

    return res.json({ ok: true, id: novedad.id });
  } catch (error) {
    console.error('[Sync Novedad Error]', error);
    return res.status(500).json({ ok: false, error: 'Error al sincronizar novedad' });
  }
});

export default router;
