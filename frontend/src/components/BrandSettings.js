import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export default function BrandSettings({ onSave, onCancel }) {
  const [settings, setSettings] = useState({
    brandName: '',
    industry: 'Technology',
    defaultTone: 'Friendly',
    replySpeed: 'Fast',
    maxDailyReplies: 50,
    keywords: [],
    autoReplyEnabled: false
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Load saved settings if available
    axios.get(`${API_BASE_URL}/brand-settings`)
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(res.data);
        }
      })
      .catch(err => {
        console.error('Error loading brand settings:', err);
        // Don't show error on initial load - it might not exist yet
      });
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };
  
  const handleRemoveKeyword = (keyword) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      await axios.post(`${API_BASE_URL}/brand-settings`, settings);
      setIsSaving(false);
      if (onSave) onSave(settings);
    } catch (err) {
      console.error('Error saving brand settings:', err);
      setError('Failed to save settings. Please try again.');
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Brand Settings</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Brand Name</label>
          <input
            type="text"
            name="brandName"
            value={settings.brandName}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Your Brand Name"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Industry</label>
          <select
            name="industry"
            value={settings.industry}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option>Technology</option>
            <option>Retail</option>
            <option>Healthcare</option>
            <option>Finance</option>
            <option>Education</option>
            <option>Entertainment</option>
            <option>Food & Beverage</option>
            <option>Other</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Default Reply Tone</label>
          <select
            name="defaultTone"
            value={settings.defaultTone}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option>Friendly</option>
            <option>Professional</option>
            <option>Witty</option>
            <option>Empathetic</option>
            <option>Formal</option>
            <option>Casual</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Auto-Reply</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="autoReplyEnabled"
              checked={settings.autoReplyEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm">Enable automatic replies</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Keywords to Monitor</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 border rounded p-2"
              placeholder="Add keyword"
            />
            <button 
              type="button"
              onClick={handleAddKeyword}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {settings.keywords.map(keyword => (
              <div key={keyword} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                <span className="text-sm">{keyword}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2 mt-6">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
