import React, { useState, useRef } from 'react';
import { DY_PRODUCTS } from '../data/dyProducts';
import { parseVoice, parseImage } from '../services/api';
import { Mic, Camera, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CargarPrecio({
  currentUser,
  locales,
  onSaveLocal,
  onAddRecord,
  showToast
}) {
  // Estado de PDV
  const [nombreLocal, setNombreLocal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');

  // Modo Ráfaga
  const [rafagaActiva, setRafagaActiva] = useState(false);
  const [rafagaPDV, setRafagaPDV] = useState(null);

  // Estado de Producto relevado
  const [categoria, setCategoria] = useState('');
  const [producto, setProducto] = useState('');
  const [gramaje, setGramaje] = useState('');
  const [marca, setMarca] = useState('');
  const [precio, setPrecio] = useState('');
  const [comentario, setComentario] = useState('');

  // Referencia Don Yeyo
  const [dyRef, setDyRef] = useState('');
  const [dyPrecio, setDyPrecio] = useState('');

  // Estados de IA (Voz y Foto)
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Autocompletado de locales
  const [acMatches, setAcMatches] = useState([]);
  const [showAc, setShowAc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Manejador Autocompletado
  const handleLocalInput = (val) => {
    setNombreLocal(val);
    if (!val.trim()) {
      setShowAc(false);
      return;
    }
    const q = val.toLowerCase();
    const matches = locales.filter((l) => l.nombre.toLowerCase().includes(q)).slice(0, 5);
    setAcMatches(matches);
    setShowAc(matches.length > 0);
  };

  const seleccionarLocal = (loc) => {
    setNombreLocal(loc.nombre);
    setCiudad(loc.ciudad || '');
    setDireccion(loc.direccion || '');
    setShowAc(false);
  };

  // Modo Ráfaga
  const activarRafaga = () => {
    if (!nombreLocal.trim()) {
      showToast('Ingresa primero el nombre del local');
      return;
    }
    const pdvData = { nombre: nombreLocal.trim(), ciudad: ciudad.trim(), direccion: direccion.trim() };
    setRafagaPDV(pdvData);
    setRafagaActiva(true);
    showToast('Modo ráfaga activado');
  };

  const desactivarRafaga = () => {
    setRafagaActiva(false);
    setRafagaPDV(null);
    showToast('Modo ráfaga desactivado');
  };

  // Entrada por Voz + IA
  const toggleVoz = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('Escuchando... Hablá: local, producto, marca y precio.');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceStatus(`Interpretando: "${transcript}"...`);

      try {
        const result = await parseVoice(transcript);
        if (result && result.ok && result.data) {
          const d = result.data;
          if (d.local && !rafagaActiva) setNombreLocal(d.local);
          if (d.ciudad && !rafagaActiva) setCiudad(d.ciudad);
          if (d.producto) setProducto(d.producto);
          if (d.gramaje) setGramaje(d.gramaje);
          if (d.marca) setMarca(d.marca);
          if (d.precio > 0) setPrecio(String(d.precio));
          setVoiceStatus('Datos completados con IA — revisá y registrá.');
        } else {
          setVoiceStatus('No se pudieron extraer los datos. Completá manualmente.');
        }
      } catch (err) {
        setVoiceStatus('Error al contactar IA. Completá manualmente.');
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceStatus('Error en micrófono o reconocimiento.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Foto OCR + Visión IA
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setOcrPreview(dataUrl);
      setOcrLoading(true);
      showToast('Analizando etiqueta con IA...');

      try {
        const result = await parseImage(dataUrl, file.type || 'image/jpeg');
        if (result && result.ok && result.data) {
          const d = result.data;
          if (d.producto) setProducto(d.producto);
          if (d.gramaje) setGramaje(d.gramaje);
          if (d.marca) setMarca(d.marca);
          if (d.precio > 0) setPrecio(String(d.precio));
          showToast('Datos leídos de la etiqueta');
        } else {
          showToast('No se detectó el precio claramente');
        }
      } catch (err) {
        showToast('Error al procesar foto con IA');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Registro de Precio
  const registrar = () => {
    if (isSubmitting) return;

    const locNombre = rafagaActiva ? rafagaPDV.nombre : nombreLocal.trim();
    const locCiudad = rafagaActiva ? rafagaPDV.ciudad : ciudad.trim();
    const locDir = rafagaActiva ? rafagaPDV.direccion : direccion.trim();
    const numPrecio = parseFloat(precio);

    if (!locNombre) return showToast('Ingresa el nombre del local');
    if (!categoria) return showToast('Selecciona una categoría');
    if (!producto.trim()) return showToast('Ingresa el producto');
    if (!marca.trim()) return showToast('Ingresa la marca');
    if (isNaN(numPrecio) || numPrecio <= 0) return showToast('Ingresa un precio válido');

    setIsSubmitting(true);
    onSaveLocal({ nombre: locNombre, ciudad: locCiudad, direccion: locDir });

    const numDyPrecio = dyPrecio !== '' ? (parseFloat(dyPrecio) || 0) : '';
    const refDyLimipio = dyRef.trim();

    const newRecord = {
      id: Date.now(),
      fecha: now.toLocaleDateString('es-AR'),
      hora: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      usuario: currentUser?.usuario || '',
      nombre: locNombre,
      ciudad: locCiudad,
      direccion: locDir,
      cat: categoria,
      prod: producto.trim(),
      gramaje: gramaje.trim(),
      marca: marca.trim(),
      precio: numPrecio,

      // Referencia Don Yeyo
      'Ref DY': refDyLimipio,
      'Ref. DY': refDyLimipio,
      'Producto Propio': refDyLimipio,
      dyRef: refDyLimipio,
      refDy: refDyLimipio,
      prodPropio: refDyLimipio,
      productoPropio: refDyLimipio,

      // Precio Propio / Precio Pro (Columna N exacta)
      'Precio Pro': numDyPrecio,
      'Precio pro': numDyPrecio,
      'precio pro': numDyPrecio,
      'PRECIO PRO': numDyPrecio,
      'Precio Propio': numDyPrecio,
      'Precio DY': numDyPrecio,
      precioPro: numDyPrecio,
      PrecioPro: numDyPrecio,
      precio_pro: numDyPrecio,
      precioPropio: numDyPrecio,
      precio_propio: numDyPrecio,
      dyPrecio: numDyPrecio,
      precioDY: numDyPrecio,
      precioDy: numDyPrecio,
      dy_precio: numDyPrecio,
      N: numDyPrecio,
      colN: numDyPrecio,

      comentario: comentario.trim(),
      pendiente: true,
      lat: '',
      lng: ''
    };

    const finalizarRegistro = (recordFinal) => {
      onAddRecord(recordFinal);

      // Limpiar formulario producto manteniendo local si está en ráfaga
      setProducto('');
      setGramaje('');
      setMarca('');
      setPrecio('');
      setComentario('');
      setDyRef('');
      setDyPrecio('');
      setOcrPreview(null);
      setVoiceStatus('');
      setIsSubmitting(false);
      showToast('Precio registrado correctamente');
    };

    // Obtener Geolocalización con timeout rápido si está disponible
    if (navigator.geolocation) {
      let geoProcessed = false;
      const geoTimeout = setTimeout(() => {
        if (!geoProcessed) {
          geoProcessed = true;
          finalizarRegistro(newRecord);
        }
      }, 2000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!geoProcessed) {
            geoProcessed = true;
            clearTimeout(geoTimeout);
            newRecord.lat = pos.coords.latitude.toFixed(6);
            newRecord.lng = pos.coords.longitude.toFixed(6);
            finalizarRegistro(newRecord);
          }
        },
        () => {
          if (!geoProcessed) {
            geoProcessed = true;
            clearTimeout(geoTimeout);
            finalizarRegistro(newRecord);
          }
        },
        { timeout: 2000 }
      );
    } else {
      finalizarRegistro(newRecord);
    }
  };

  // Catálogo Don Yeyo filtrado
  const dyOptions = categoria && DY_PRODUCTS[categoria] ? DY_PRODUCTS[categoria] : [];

  return (
    <div className="tab-pane">
      {/* Modo Ráfaga Banner */}
      {rafagaActiva && (
        <div className="rafaga-bar">
          <div>
            <div className="rafaga-info">⚡ Modo ráfaga activo</div>
            <div className="rafaga-sub">
              {rafagaPDV?.nombre} {rafagaPDV?.ciudad ? `— ${rafagaPDV.ciudad}` : ''}
            </div>
          </div>
          <button className="btn-rafaga-off" onClick={desactivarRafaga}>
            Desactivar
          </button>
        </div>
      )}

      {/* Botones de acción rápida: Voz y Foto */}
      <div className="action-btns">
        <button
          type="button"
          className={`btn-action ${isListening ? 'listening' : ''}`}
          onClick={toggleVoz}
        >
          <Mic size={16} /> {isListening ? 'Escuchando...' : 'Voz'}
        </button>
        <button
          type="button"
          className="btn-action"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera size={16} /> Foto OCR
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {voiceStatus && <div style={{ fontSize: '12px', color: '#E8003D', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>{voiceStatus}</div>}

      {/* Sección Punto de Venta (oculta si ráfaga está activa) */}
      {!rafagaActiva && (
        <>
          <div className="section-label">Punto de Venta</div>
          <div className="card">
            <div className="field">
              <label>Nombre del local / Supermercado</label>
              <input
                type="text"
                placeholder="Ej: Carrefour Palermo, Coto Lanús..."
                value={nombreLocal}
                onChange={(e) => handleLocalInput(e.target.value)}
                autoComplete="off"
              />
              {showAc && (
                <div className="ac-list">
                  {acMatches.map((loc, idx) => (
                    <div
                      key={idx}
                      className="ac-item"
                      onMouseDown={() => seleccionarLocal(loc)}
                    >
                      {loc.nombre}
                      {(loc.ciudad || loc.direccion) && (
                        <div className="ac-sub">{[loc.ciudad, loc.direccion].filter(Boolean).join(' - ')}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="row2">
              <div className="field">
                <label>Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Rosario, CABA"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Corrientes 1200"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-action"
              style={{ width: '100%', marginTop: '4px', background: '#1a2b6b', color: '#fff', border: 'none' }}
              onClick={activarRafaga}
            >
              <Zap size={14} /> Fijar PDV (Modo Ráfaga)
            </button>
          </div>
        </>
      )}

      {/* Sección Producto Relevado */}
      <div className="section-label">Producto Relevado</div>
      <div className="card">
        <div className="field">
          <label>Categoría</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Selecciona categoría</option>
            <option value="Pastas">Pastas</option>
            <option value="Tapas">Tapas</option>
            <option value="Panificado">Panificado</option>
            <option value="Varios">Varios</option>
            <option value="Prod de Fiesta">Prod de Fiesta</option>
          </select>
        </div>

        <div className="field">
          <label>Nombre del Producto</label>
          <input
            type="text"
            placeholder="Ej: Pan de molde blanco, Ravioles de espinaca..."
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label>Gramaje</label>
            <input
              type="text"
              placeholder="Ej: 500g, 1Kg"
              value={gramaje}
              onChange={(e) => setGramaje(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Marca</label>
            <input
              type="text"
              placeholder="Ej: Bimbo, Fargo, La Salteña"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            />
          </div>
        </div>

        <div className="price-row">
          <div className="currency">$</div>
          <div className="field">
            <label>Precio Competencia</label>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: '12px' }}>
          <label>Comentario <span>(ofertas, ubicación, etc.)</span></label>
          <input
            type="text"
            placeholder="Ej: 2da unidad al 70%, precio regular..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </div>

        {ocrPreview && (
          <div style={{ marginTop: '10px' }}>
            <img
              src={ocrPreview}
              alt="Preview etiqueta"
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px' }}
            />
          </div>
        )}
      </div>

      {/* Referencia Don Yeyo */}
      <div className="section-label">Ref. Don Yeyo <span>(Opcional para comparativa)</span></div>
      <div className="card">
        <div className="field">
          <label htmlFor="dy-ref">Producto Propio de Referencia</label>
          <select
            id="dy-ref"
            name="dyRef"
            value={dyRef}
            onChange={(e) => setDyRef(e.target.value)}
          >
            <option value="">Sin referencia</option>
            {dyOptions.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="field" id="dy-precio-field" style={{ marginTop: '12px' }}>
          <label htmlFor="precio-pro">Precio Propio en Góndola (Precio Pro) <span>(Opcional)</span></label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div className="currency">$</div>
            <input
              id="precio-pro"
              name="Precio Pro"
              data-col="N"
              data-testid="input-precio-pro"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={dyPrecio}
              onChange={(e) => setDyPrecio(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={registrar}
        disabled={isSubmitting}
        style={isSubmitting ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
      >
        {isSubmitting ? 'Registrando...' : '+ Registrar Precio'}
      </button>
      <div style={{ height: '30px' }}></div>
    </div>
  );
}
