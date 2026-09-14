import React, { useState, useRef } from 'react';
import { syncNovedadRecord } from '../services/api';
import { Camera, Trash2 } from 'lucide-react';

export default function NovedadesPDV({
  novedades,
  onAddNovedad,
  onDeleteNovedad,
  currentUser,
  showToast
}) {
  const [pdv, setPdv] = useState('');
  const [tipo, setTipo] = useState('');
  const [comentario, setComentario] = useState('');
  const [foto, setFoto] = useState('');
  const fileInputRef = useRef(null);

  const handleFotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFoto(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    if (!pdv.trim()) return showToast('Ingresa el nombre del PDV');
    if (!tipo) return showToast('Selecciona el tipo de novedad');
    if (!comentario.trim()) return showToast('Escribe un comentario');

    const now = new Date();
    const newNov = {
      id: Date.now(),
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      usuario: currentUser?.usuario || '',
      pdv: pdv.trim(),
      tipo,
      comentario: comentario.trim(),
      foto
    };

    onAddNovedad(newNov);

    // Intentar sincronizar con backend
    try {
      await syncNovedadRecord(newNov);
    } catch (e) {
      console.log('Novedad guardada offline');
    }

    // Limpiar formulario
    setPdv('');
    setTipo('');
    setComentario('');
    setFoto('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Novedad guardada correctamente');
  };

  return (
    <div className="tab-pane">
      <div className="section-label">Nueva Novedad en Góndola</div>
      <div className="card">
        <div className="field">
          <label>Punto de Venta</label>
          <input
            type="text"
            placeholder="Ej: Coto Lanús, Jumbo Palermo..."
            value={pdv}
            onChange={(e) => setPdv(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Tipo de Novedad</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Selecciona tipo</option>
            <option value="Solicitud de producto">Solicitud de producto</option>
            <option value="Problema con exhibicion">Problema con exhibición</option>
            <option value="Queja / Reclamo">Queja / Reclamo</option>
            <option value="Oportunidad comercial">Oportunidad comercial</option>
            <option value="Faltante de stock">Faltante de stock</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="field">
          <label>Comentario descriptivo</label>
          <textarea
            rows="3"
            placeholder="Describe la situación observada en el PDV..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Foto de Evidencia <span>(Opcional)</span></label>
          <button
            type="button"
            className="btn-action"
            style={{ width: '100%', marginBottom: '8px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} /> {foto ? 'Cambiar Foto' : 'Sacar / Adjuntar Foto'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoUpload}
            style={{ display: 'none' }}
          />

          {foto && (
            <div style={{ marginTop: '8px' }}>
              <img
                src={foto}
                alt="Evidencia"
                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px' }}
              />
            </div>
          )}
        </div>

        <button type="button" className="btn-primary" onClick={guardar}>
          + Guardar Novedad
        </button>
      </div>

      <div className="section-label">Novedades Registradas</div>
      {!novedades.length ? (
        <div className="empty-state">Sin novedades registradas aún.</div>
      ) : (
        novedades.map((n) => (
          <div key={n.id} className="entry" style={{ borderLeftColor: '#1a2b6b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="entry-cat" style={{ background: '#f0f3fb' }}>{n.tipo}</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1c2e', marginTop: '2px' }}>{n.pdv}</div>
                <div className="entry-meta">{n.usuario} • {n.fecha} {n.hora}</div>
              </div>
              <button
                type="button"
                onClick={() => onDeleteNovedad(n.id)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#374151', marginTop: '8px', lineHeight: '1.4' }}>
              {n.comentario}
            </div>
            {n.foto && (
              <img
                src={n.foto}
                alt="Foto novedad"
                style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }}
              />
            )}
          </div>
        ))
      )}

      <div style={{ height: '30px' }}></div>
    </div>
  );
}
