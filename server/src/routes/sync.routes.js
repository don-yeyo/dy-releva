import { Router } from 'express';

const router = Router();

// Caché de deduplicación en memoria para evitar inserciones dobles simultáneas (ventana de 60s)
const recentSyncIds = new Map();

function checkAndMarkDuplicate(id) {
  if (!id) return false;
  const now = Date.now();
  for (const [key, time] of recentSyncIds.entries()) {
    if (now - time > 60000) recentSyncIds.delete(key);
  }
  const strId = String(id);
  if (recentSyncIds.has(strId)) {
    return true;
  }
  recentSyncIds.set(strId, now);
  return false;
}

// Sincronizar un registro de relevamiento de precio
router.post('/price', async (req, res) => {
  try {
    const record = req.body || {};
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (record.id && checkAndMarkDuplicate(record.id)) {
      console.warn(`[Sync Price] Registro #${record.id} ya fue procesado recientemente. Omitiendo duplicado.`);
      return res.json({ ok: true, duplicated: true, id: record.id });
    }

    if (!scriptUrl) {
      console.warn('[Sync Price] GOOGLE_SCRIPT_URL no configurada. Simulando sincronización exitosa.');
      return res.json({ ok: true, simulated: true, id: record.id });
    }

    // Normalizar precio propio (Precio Pro) y producto propio de referencia
    const rawPrecioPro = record['Precio Pro'] ?? record['Precio pro'] ?? record['precio pro'] ?? record.precioPro ?? record.dyPrecio ?? record.precioPropio ?? record.precio_pro ?? record['PRECIO PRO'];
    const precioProValue = (rawPrecioPro !== undefined && rawPrecioPro !== null && rawPrecioPro !== '') ? Number(rawPrecioPro) : '';

    const refDyValue = String(record['Ref DY'] || record['Ref. DY'] || record.dyRef || record.refDy || record.prodPropio || record.productoPropio || record['Producto Propio'] || '').trim();

    const normalizedRecord = {
      ...record,
      // Nombres exactos de las columnas en Google Sheets
      'Fecha': record.fecha || record.Fecha || '',
      'Hora': record.hora || record.Hora || '',
      'Usuario': record.usuario || record.Usuario || '',
      'Local': record.nombre || record.local || record.Local || record.Nombre || '',
      'Nombre': record.nombre || record.local || record.Local || record.Nombre || '',
      'Ciudad': record.ciudad || record.Ciudad || '',
      'Direccion': record.direccion || record.Direccion || record['Dirección'] || '',
      'Dirección': record.direccion || record.Direccion || record['Dirección'] || '',
      'Categoria': record.cat || record.categoria || record.Categoria || record['Categoría'] || '',
      'Categoría': record.cat || record.categoria || record.Categoria || record['Categoría'] || '',
      'Producto': record.prod || record.producto || record.Producto || '',
      'Gramaje': record.gramaje || record.Gramaje || '',
      'Marca': record.marca || record.Marca || '',
      'Precio': Number(record.precio || record.Precio || 0),
      'Precio Competencia': Number(record.precio || record.Precio || 0),
      'Comentario': record.comentario || record.Comentario || '',
      'Ref DY': refDyValue,
      'Ref. DY': refDyValue,
      'Producto Propio': refDyValue,
      'Precio Pro': precioProValue,
      'Precio pro': precioProValue,
      'precio pro': precioProValue,
      'PRECIO PRO': precioProValue,
      'Precio Propio': precioProValue,
      'Precio DY': precioProValue,
      'Lat': record.lat || record.Lat || '',
      'Lng': record.lng || record.Lng || '',
      'Latitud': record.lat || record.Lat || '',
      'Longitud': record.lng || record.Lng || '',

      // Nombres camelCase y snake_case para compatibilidad total
      fecha: record.fecha || record.Fecha || '',
      hora: record.hora || record.Hora || '',
      usuario: record.usuario || record.Usuario || '',
      nombre: record.nombre || record.local || record.Local || record.Nombre || '',
      local: record.nombre || record.local || record.Local || record.Nombre || '',
      ciudad: record.ciudad || record.Ciudad || '',
      direccion: record.direccion || record.Direccion || record['Dirección'] || '',
      cat: record.cat || record.categoria || record.Categoria || '',
      categoria: record.cat || record.categoria || record.Categoria || '',
      prod: record.prod || record.producto || record.Producto || '',
      producto: record.prod || record.producto || record.Producto || '',
      gramaje: record.gramaje || record.Gramaje || '',
      marca: record.marca || record.Marca || '',
      precio: Number(record.precio || record.Precio || 0),
      comentario: record.comentario || record.Comentario || '',
      dyRef: refDyValue,
      refDy: refDyValue,
      prodPropio: refDyValue,
      productoPropio: refDyValue,
      dyPrecio: precioProValue,
      precioPro: precioProValue,
      PrecioPro: precioProValue,
      precioPropio: precioProValue,
      precio_pro: precioProValue,
      precioDY: precioProValue,
      precioDy: precioProValue,
      N: precioProValue,
      colN: precioProValue,
      columnaN: precioProValue,
      col14: precioProValue,
      lat: record.lat || record.Lat || '',
      lng: record.lng || record.Lng || ''
    };

    console.log(`[Sync Price] Enviando registro #${record.id} a Google Sheets ("Precio Pro": $${precioProValue}, "Ref DY": "${refDyValue}")...`);

    // Pasar también query params en la URL por si Google Apps Script lee de e.parameter
    const queryParams = new URLSearchParams({
      'Precio Pro': String(precioProValue),
      'precioPro': String(precioProValue),
      'dyPrecio': String(precioProValue),
      'Ref DY': refDyValue,
      'dyRef': refDyValue
    });

    const targetUrl = scriptUrl.includes('?')
      ? `${scriptUrl}&${queryParams.toString()}`
      : `${scriptUrl}?${queryParams.toString()}`;

    const response = await fetch(targetUrl, {
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
