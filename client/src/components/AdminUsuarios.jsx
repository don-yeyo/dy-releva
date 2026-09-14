import React, { useState } from 'react';
import { UserPlus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsuarios({
  usuarios,
  onAddUsuario,
  onToggleActivo,
  onDeleteUsuario,
  showToast
}) {
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');

  const handleAgregar = (e) => {
    e.preventDefault();
    const u = nuevoUsuario.trim().toLowerCase();
    const p = nuevaContrasena.trim();
    const n = nuevoNombre.trim();

    if (!u || !p) {
      showToast('Completa usuario y contraseña');
      return;
    }

    if (usuarios.some((x) => x.usuario.toLowerCase() === u)) {
      showToast('Ese nombre de usuario ya existe');
      return;
    }

    onAddUsuario({
      usuario: u,
      contrasena: p,
      nombre: n || u,
      activo: 'SI'
    });

    setNuevoUsuario('');
    setNuevaContrasena('');
    setNuevoNombre('');
    showToast('Usuario creado correctamente');
  };

  return (
    <div className="tab-pane">
      <div className="section-label">Crear Nuevo Operador</div>
      <div className="card">
        <form onSubmit={handleAgregar}>
          <div className="row2">
            <div className="field">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="ej: mlopez"
                value={nuevoUsuario}
                onChange={(e) => setNuevoUsuario(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                type="text"
                placeholder="ej: 1234"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Nombre Completo</label>
            <input
              type="text"
              placeholder="ej: Manuel López"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
            <UserPlus size={16} /> Agregar Usuario
          </button>
        </form>
      </div>

      <div className="section-label">Usuarios del Sistema</div>
      <div className="card">
        {!usuarios.length ? (
          <div className="empty-state">Sin usuarios adicionales configurados.</div>
        ) : (
          usuarios.map((u, idx) => {
            const activo = (u.activo || 'SI') === 'SI';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < usuarios.length - 1 ? '1px solid #e2e6f0' : 'none'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1c2e' }}>{u.usuario}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{u.nombre}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onToggleActivo(idx)}
                    style={{
                      border: '1px solid #d0d8ee',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: activo ? '#e6f9ed' : '#fde8e8',
                      color: activo ? '#1a7a3a' : '#c0002f'
                    }}
                  >
                    {activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteUsuario(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ height: '30px' }}></div>
    </div>
  );
}
