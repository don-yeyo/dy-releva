import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body || {};
    const cleanUser = (usuario || '').trim().toLowerCase();
    const cleanPass = (contrasena || '').trim();

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
    }

    const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'dyAdmin2024';

    // 1. Verificación de Administrador
    if (cleanUser === adminUser && cleanPass === adminPass) {
      return res.json({
        ok: true,
        usuario: adminUser,
        nombre: 'Administrador',
        isAdmin: true
      });
    }

    // 2. Verificación de Usuario Operador local por defecto
    const defaultOpUser = (process.env.DEFAULT_OPERATOR_USER || 'un_user').toLowerCase();
    const defaultOpPass = process.env.DEFAULT_OPERATOR_PASS || 'user';
    const defaultOpName = process.env.DEFAULT_OPERATOR_NAME || 'Default User';

    if (cleanUser === defaultOpUser && cleanPass === defaultOpPass) {
      return res.json({
        ok: true,
        usuario: defaultOpUser,
        nombre: defaultOpName,
        isAdmin: false
      });
    }

    // 3. Verificación remota contra Google Apps Script si está configurado
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (scriptUrl) {
      try {
        const verifyUrl = `${scriptUrl}?action=login&usuario=${encodeURIComponent(cleanUser)}&contrasena=${encodeURIComponent(cleanPass)}`;
        const remoteRes = await fetch(verifyUrl);
        const remoteData = await remoteRes.json();

        if (remoteData && remoteData.ok) {
          return res.json({
            ok: true,
            usuario: remoteData.usuario || cleanUser,
            nombre: remoteData.nombre || cleanUser,
            isAdmin: false
          });
        }
      } catch (remoteErr) {
        console.warn('[Auth Warning] No se pudo verificar con Google Sheets:', remoteErr.message);
      }
    }

    return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos' });
  } catch (error) {
    console.error('[Auth Error]', error);
    return res.status(500).json({ ok: false, error: 'Error interno en autenticación' });
  }
});

export default router;
