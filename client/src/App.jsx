import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import Login from './components/Login';
import CargarPrecio from './components/CargarPrecio';
import Historial from './components/Historial';
import Dashboard from './components/Dashboard';
import NovedadesPDV from './components/NovedadesPDV';
import AdminUsuarios from './components/AdminUsuarios';
import Toast from './components/Toast';
import { loadData, saveData, getUserStorageKey } from './services/storage';
import { syncPriceRecord } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('cargar');
  const [toastMsg, setToastMsg] = useState('');

  // Datos globales y específicos del usuario
  const [locales, setLocales] = useState(() => loadData('dy_locales_v1', []));
  const [registros, setRegistros] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [usuarios, setUsuarios] = useState(() => loadData('dy_usuarios_admin', []));

  // Helper para mostrar notificaciones Toast
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Cargar datos del usuario al iniciar sesión
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    const regKey = getUserStorageKey('registros', user.usuario);
    const novKey = getUserStorageKey('novedades', user.usuario);
    const loadedRegistros = loadData(regKey, []);
    const loadedNovedades = loadData(novKey, []);
    setRegistros(loadedRegistros);
    setNovedades(loadedNovedades);
    setActiveTab('cargar');
    showToast(`Bienvenido, ${user.nombre || user.usuario}`);
  };

  // Logout
  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) {
      setCurrentUser(null);
      setRegistros([]);
      setNovedades([]);
      setActiveTab('cargar');
    }
  };

  // Guardar nuevo local en autocompletado
  const handleSaveLocal = (nuevoLocal) => {
    if (!nuevoLocal.nombre) return;
    const existe = locales.some((l) => l.nombre.toLowerCase() === nuevoLocal.nombre.toLowerCase());
    if (!existe) {
      const updated = [nuevoLocal, ...locales];
      setLocales(updated);
      saveData('dy_locales_v1', updated);
    }
  };

  // Agregar registro de precio y sincronizar inmediatamente si hay conexión
  const handleAddRecord = async (record) => {
    const updated = [record, ...registros];
    setRegistros(updated);
    if (currentUser) {
      const regKey = getUserStorageKey('registros', currentUser.usuario);
      saveData(regKey, updated);
    }

    // Intentar sincronizar inmediatamente con el backend
    if (navigator.onLine) {
      try {
        const res = await syncPriceRecord(record);
        if (res && res.ok) {
          setRegistros((prevRegistros) => {
            const synced = prevRegistros.map((r) =>
              r.id === record.id ? { ...r, pendiente: false } : r
            );
            if (currentUser) {
              const regKey = getUserStorageKey('registros', currentUser.usuario);
              saveData(regKey, synced);
            }
            return synced;
          });
        }
      } catch (e) {
        console.log('[Sync] Guardado offline / pendiente para sincronización automática');
      }
    }
  };

  // Referencia para evitar sincronizaciones simultáneas
  const isSyncingRef = React.useRef(false);

  // Sincronización automática de pendientes al reconectar a internet o periódicamente
  useEffect(() => {
    const sincronizarPendientes = async () => {
      if (!navigator.onLine || !currentUser || isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        const regKey = getUserStorageKey('registros', currentUser.usuario);
        const currentSaved = loadData(regKey, []);
        const pendientes = currentSaved.filter((r) => r.pendiente);

        if (!pendientes.length) {
          isSyncingRef.current = false;
          return;
        }

        let sincronizados = 0;
        const syncedIds = new Set();

        for (const item of pendientes) {
          try {
            const res = await syncPriceRecord(item);
            if (res && res.ok) {
              syncedIds.add(item.id);
              sincronizados++;
            }
          } catch (e) {
            break;
          }
        }

        if (syncedIds.size > 0) {
          setRegistros((prev) => {
            const actualizados = prev.map((r) =>
              syncedIds.has(r.id) ? { ...r, pendiente: false } : r
            );
            saveData(regKey, actualizados);
            return actualizados;
          });
          showToast(`${sincronizados} registro(s) sincronizado(s) con Google Sheets`);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    window.addEventListener('online', sincronizarPendientes);
    const interval = setInterval(sincronizarPendientes, 30000);

    return () => {
      window.removeEventListener('online', sincronizarPendientes);
      clearInterval(interval);
    };
  }, [currentUser]);

  return (
    <div className="app-container">
      <div className="mobile-shell">
        {!currentUser ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            <Header currentUser={currentUser} onLogout={handleLogout} />
            <TabNav
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              isAdmin={currentUser.isAdmin}
            />

            {activeTab === 'cargar' && (
              <CargarPrecio
                currentUser={currentUser}
                locales={locales}
                onSaveLocal={handleSaveLocal}
                onAddRecord={handleAddRecord}
                showToast={showToast}
              />
            )}

            {activeTab === 'historial' && (
              <Historial
                registros={registros}
                onDeleteRecord={handleDeleteRecord}
                showToast={showToast}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard registros={registros} />
            )}

            {activeTab === 'pdv' && (
              <NovedadesPDV
                novedades={novedades}
                onAddNovedad={handleAddNovedad}
                onDeleteNovedad={handleDeleteNovedad}
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'admin' && currentUser.isAdmin && (
              <AdminUsuarios
                usuarios={usuarios}
                onAddUsuario={handleAddUsuario}
                onToggleActivo={handleToggleActivo}
                onDeleteUsuario={handleDeleteUsuario}
                showToast={showToast}
              />
            )}
          </>
        )}

        <Toast message={toastMsg} />
      </div>
    </div>
  );
}
