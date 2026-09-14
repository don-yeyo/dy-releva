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

  // Agregar registro de precio
  const handleAddRecord = (record) => {
    const updated = [record, ...registros];
    setRegistros(updated);
    if (currentUser) {
      const regKey = getUserStorageKey('registros', currentUser.usuario);
      saveData(regKey, updated);
    }
  };

  // Eliminar registro
  const handleDeleteRecord = (id) => {
    if (!window.confirm('¿Eliminar este registro de precio?')) return;
    const updated = registros.filter((r) => r.id !== id);
    setRegistros(updated);
    if (currentUser) {
      const regKey = getUserStorageKey('registros', currentUser.usuario);
      saveData(regKey, updated);
    }
    showToast('Registro eliminado');
  };

  // Agregar novedad
  const handleAddNovedad = (novedad) => {
    const updated = [novedad, ...novedades];
    setNovedades(updated);
    if (currentUser) {
      const novKey = getUserStorageKey('novedades', currentUser.usuario);
      saveData(novKey, updated);
    }
  };

  // Eliminar novedad
  const handleDeleteNovedad = (id) => {
    if (!window.confirm('¿Eliminar esta novedad?')) return;
    const updated = novedades.filter((n) => n.id !== id);
    setNovedades(updated);
    if (currentUser) {
      const novKey = getUserStorageKey('novedades', currentUser.usuario);
      saveData(novKey, updated);
    }
    showToast('Novedad eliminada');
  };

  // Gestión de usuarios locales (Admin)
  const handleAddUsuario = (userObj) => {
    const updated = [...usuarios, userObj];
    setUsuarios(updated);
    saveData('dy_usuarios_admin', updated);
  };

  const handleToggleActivo = (index) => {
    const updated = [...usuarios];
    updated[index].activo = updated[index].activo === 'SI' ? 'NO' : 'SI';
    setUsuarios(updated);
    saveData('dy_usuarios_admin', updated);
  };

  const handleDeleteUsuario = (index) => {
    if (!window.confirm('¿Borrar este usuario?')) return;
    const updated = usuarios.filter((_, idx) => idx !== index);
    setUsuarios(updated);
    saveData('dy_usuarios_admin', updated);
    showToast('Usuario eliminado');
  };

  // Sincronización automática de pendientes al reconectar a internet
  useEffect(() => {
    const sincronizarPendientes = async () => {
      if (!navigator.onLine || !currentUser) return;
      const pendientes = registros.filter((r) => r.pendiente);
      if (!pendientes.length) return;

      let sincronizados = 0;
      const registrosActualizados = [...registros];

      for (const item of pendientes) {
        try {
          const res = await syncPriceRecord(item);
          if (res && res.ok) {
            const idx = registrosActualizados.findIndex((x) => x.id === item.id);
            if (idx > -1) {
              registrosActualizados[idx].pendiente = false;
              sincronizados++;
            }
          }
        } catch (e) {
          break;
        }
      }

      if (sincronizados > 0) {
        setRegistros(registrosActualizados);
        const regKey = getUserStorageKey('registros', currentUser.usuario);
        saveData(regKey, registrosActualizados);
        showToast(`${sincronizados} registro(s) sincronizado(s) con Google Sheets`);
      }
    };

    window.addEventListener('online', sincronizarPendientes);
    const interval = setInterval(sincronizarPendientes, 30000);

    return () => {
      window.removeEventListener('online', sincronizarPendientes);
      clearInterval(interval);
    };
  }, [registros, currentUser]);

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
