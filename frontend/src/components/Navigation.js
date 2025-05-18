import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tweets', label: 'Tweets' },
    { id: 'settings', label: 'Brand Settings' },
    { id: 'history', label: 'Reply History' }
  ];
  
  return (
    <nav className="flex justify-center mb-6 bg-white shadow rounded-lg overflow-hidden">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-6 py-3 text-sm font-medium ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
