import React from 'react';
import { Download, Trash2, MapPin } from 'lucide-react';

export default function Historial({ registros, onDeleteRecord, showToast }) {
  const exportarCSV = () => {
    if (!registros.length) {
      showToast('No hay registros para exportar');
      return;
    }

    const hoy = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    let csv = 'Fecha,Hora,Usuario,Local,Ciudad,Direccion,Categoria,Producto,Gramaje,Marca,Precio,Comentario,Ref DY,Precio DY,Lat,Lng\n';

    registros.forEach((r) => {
      csv += [
        r.fecha,
        r.hora,
        `"${r.usuario || ''}"`,
        `"${r.nombre || ''}"`,
        `"${r.ciudad || ''}"`,
        `"${r.direccion || ''}"`,
        `"${r.cat || ''}"`,
        `"${r.prod || ''}"`,
        `"${r.gramaje || ''}"`,
        `"${r.marca || ''}"`,
        r.precio,
        `"${r.comentario || ''}"`,
        `"${r.dyRef || ''}"`,
        r.dyPrecio || '',
        r.lat || '',
        r.lng || ''
      ].join(',') + '\n';
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relevamiento_precios_${hoy}.csv`;
    link.click();
    showToast('CSV descargado con éxito');
  };

  return (
    <div className="tab-pane">
      <div className="section-label">
        <span>Historial de Registros</span>
        <span style={{ background: '#E8003D', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>
          {registros.length}
        </span>
      </div>

      {!registros.length ? (
        <div className="empty-state">Aún no hay registros cargados hoy.</div>
      ) : (
        registros.map((r) => {
          const precioFormatted = Number(r.precio).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

          return (
            <div key={r.id} className="entry">
              <div className="entry-row">
                <div className="entry-left">
                  <span className="entry-cat">{r.cat}</span>
                  <div className="entry-prod">
                    {r.marca} — {r.prod} {r.gramaje ? `(${r.gramaje})` : ''}
                  </div>
                  {r.comentario && (
                    <div style={{ fontSize: '11px', color: '#856404', background: '#fff3cd', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', margin: '3px 0' }}>
                      {r.comentario}
                    </div>
                  )}
                  <div className="entry-meta">
                    <span className={`sync-dot ${r.pendiente ? 'sync-pend' : 'sync-ok'}`} title={r.pendiente ? 'Pendiente de sincronizar' : 'Sincronizado'}></span>
                    {r.nombre} {r.ciudad ? `— ${r.ciudad}` : ''} • {r.hora}
                    {r.lat && (
                      <span style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#1a2b6b' }}>
                        <MapPin size={10} /> GPS
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="entry-price">${precioFormatted}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(r.id)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {registros.length > 0 && (
        <button
          type="button"
          className="btn-action"
          style={{ width: '100%', marginTop: '14px', background: '#fff', border: '1.5px solid #d0d8ee' }}
          onClick={exportarCSV}
        >
          <Download size={16} /> Exportar Reporte CSV
        </button>
      )}

      <div style={{ height: '30px' }}></div>
    </div>
  );
}
