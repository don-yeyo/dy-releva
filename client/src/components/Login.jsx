import React, { useState } from 'react';
import { loginUser } from '../services/api';
import { APP_VERSION } from '../config/version';
import logoDonYeyo from '../assets/logo-don-yeyo-png-sin-fondo.png';
import { Lock, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = usuario.trim();
    const cleanPass = contrasena.trim();

    if (!cleanUser || !cleanPass) {
      setError('Por favor completa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(cleanUser, cleanPass);
      if (data && data.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-brand">
        <img
          src={logoDonYeyo}
          alt="Don Yeyo"
          className="login-logo-img"
        />
        <p>Relevamiento de Precios</p>
      </div>

      <div className="login-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-user">Usuario</label>
            <input
              id="login-user"
              type="text"
              placeholder="Tu usuario (ej: admin, jgallo)"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="field">
            <label htmlFor="login-pass">Contraseña</label>
            <input
              id="login-pass"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>

          {error && <div className="login-error">{error}</div>}
        </form>
      </div>

      <div className="login-version">v{APP_VERSION}</div>
    </div>
  );
}
