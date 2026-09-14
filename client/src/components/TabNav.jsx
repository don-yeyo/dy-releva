import React from 'react';

export default function TabNav({ activeTab, onSelectTab, isAdmin }) {
  const tabs = [
    { id: 'cargar', label: '+ Cargar' },
    { id: 'historial', label: 'Historial' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pdv', label: 'PDV' }
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin' });
  }

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
