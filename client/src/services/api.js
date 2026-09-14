/**
 * Cliente HTTP para comunicación con el backend (local y Netlify Functions)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function loginUser(usuario, contrasena) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasena })
  });
  return response.json();
}

export async function parseVoice(text) {
  const response = await fetch(`${BASE_URL}/ai/parse-voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return response.json();
}

export async function parseImage(imageBase64, mediaType = 'image/jpeg') {
  const response = await fetch(`${BASE_URL}/ai/parse-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64, mediaType })
  });
  return response.json();
}

export async function syncPriceRecord(record) {
  const response = await fetch(`${BASE_URL}/sync/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  return response.json();
}

export async function syncNovedadRecord(novedad) {
  const response = await fetch(`${BASE_URL}/sync/novedad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novedad)
  });
  return response.json();
}
