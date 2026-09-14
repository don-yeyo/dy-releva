import React from 'react';
import { LogOut } from 'lucide-react';

export default function Header({ currentUser, onLogout }) {
  const todayStr = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-logo-area">
          <div className="header-brand">
            DON <span>YEYO</span>
          </div>
        </div>
        <div className="header-meta">
          <div className="header-date">{todayStr}</div>
          <div className="header-user">
            Hola, {currentUser?.nombre || currentUser?.usuario}
          </div>
          <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <LogOut size={11} /> Salir
            </span>
          </button>
        </div>
      </div>
      <div className="header-stripe"></div>
    </header>
  );
}
