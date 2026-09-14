import React from 'react';
import { BarChart3, Store, Tag } from 'lucide-react';

export default function Dashboard({ registros }) {
  const hoy = new Date().toLocaleDateString('es-AR');
  const registrosHoy = registros.filter((r) => r.fecha === hoy);

  const pdvSet = new Set(registrosHoy.map((r) => r.nombre));
  const marcaSet = new Set(registrosHoy.map((r) => r.marca));

  // Promedio por marca
  const marcasMap = {};
  registrosHoy.forEach((r) => {
    if (!marcasMap[r.marca]) {
      marcasMap[r.marca] = { sum: 0, count: 0 };
    }
    marcasMap[r.marca].sum += Number(r.precio);
    marcasMap[r.marca].count += 1;
  });

  const marcasOrdenadas = Object.entries(marcasMap).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="tab-pane">
      <div className="card" style={{ background: '#fff', border: 'none', boxShadow: '0 4px 14px rgba(26,43,107,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a2b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Resumen del Día
        </div>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-num">{registrosHoy.length}</div>
            <div className="stat-lbl">Registros</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{pdvSet.size}</div>
            <div className="stat-lbl">PDVs</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">{marcaSet.size}</div>
            <div className="stat-lbl">Marcas</div>
          </div>
        </div>
      </div>

      <div className="section-label">Precio Promedio por Marca</div>
      <div className="card">
        {!marcasOrdenadas.length ? (
          <div className="empty-state">Sin relevamientos cargados hoy.</div>
        ) : (
          marcasOrdenadas.map(([marca, data], idx) => {
            const avg = Math.round(data.sum / data.count).toLocaleString('es-AR');
            return (
              <div key={idx} className="comp-row">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1c1c2e' }}>{marca}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {data.count} relevamiento{data.count > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#E8003D' }}>
                  ${avg} <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>prom.</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="section-label">PDVs Visitados Hoy</div>
      <div className="card">
        {!pdvSet.size ? (
          <div className="empty-state">Sin locales relevados hoy.</div>
        ) : (
          Array.from(pdvSet).map((pdv, idx) => {
            const count = registrosHoy.filter((r) => r.nombre === pdv).length;
            return (
              <div key={idx} className="comp-row">
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1c1c2e' }}>{pdv}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a2b6b', background: '#f0f3fb', padding: '3px 8px', borderRadius: '12px' }}>
                  {count} precio{count > 1 ? 's' : ''}
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
