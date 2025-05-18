import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ReplyGenerator({ tweet, brandSettings, onReplySent }) {
  const [tone, setTone] = useState(brandSettings?.defaultTone || 'Friendly');
  const [customReply, setCustomReply] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const handleGenerateReply = async () => {
    if (!tweet) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/generate-reply`, {
        tweet_id: tweet.id,
        tweet_text: tweet.text,
        tone,
        brand_name: brandSettings?.brandName || '',
        industry: brandSettings?.industry || ''
      });
      
      setGeneratedReply(res.data.reply || '');
      setCustomReply(res.data.reply || '');
      setIsEditing(false);
    } catch (err) {
      console.error('Error generating reply:', err);
      setError('Failed to generate reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendReply = async () => {
    if (!tweet) return;
    setLoading(true);
    setError(null);
    
    try {
      const replyToSend = isEditing ? customReply : generatedReply;
      
      const res = await axios.post(`${API_BASE_URL}/tweets/${tweet.id}/thread`, {
        username: `@${brandSettings?.brandName || 'brand'}_support`,
        text: replyToSend,
        timestamp: new Date().toISOString()
      });
      
      setFeedback('Reply sent successfully!');
      
      // Clear the generated reply after sending
      setTimeout(() => {
        setGeneratedReply('');
        setCustomReply('');
        setFeedback(null);
        if (onReplySent) onReplySent(res.data);
      }, 2000);
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFeedback = async (type) => {
    try {
      await axios.post(`${API_BASE_URL}/feedback`, {
        tweet_id: tweet.id,
        reply: generatedReply,
        feedback: type,
        tone
      });
      
      setFeedback(`Feedback recorded: ${type === 'positive' ? 'Good' : 'Needs improvement'}`);
      
      setTimeout(() => {
        setFeedback(null);
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback.');
    }
  };
  
  if (!tweet) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">AI Reply Generator</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Select a tweet to generate a reply</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2">AI Reply Generator</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {feedback && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{feedback}</p>
        </div>
      )}
      
      <div className="mb-4 bg-gray-50 p-3 rounded-lg border">
        <div className="flex justify-between items-start">
          <span className="font-medium text-sm">{tweet.username}</span>
          <span className="text-xs text-gray-400">
            {new Date(tweet.timestamp).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-800 mt-1">{tweet.text}</p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Reply Tone</label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full border rounded p-2"
          disabled={loading}
        >
          <option>Friendly</option>
          <option>Professional</option>
          <option>Witty</option>
          <option>Empathetic</option>
          <option>Formal</option>
          <option>Casual</option>
        </select>
      </div>
      
      <button
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
        onClick={handleGenerateReply}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate AI Reply'}
      </button>
      
      {generatedReply && (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold">Generated Reply:</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {isEditing ? 'Use Generated' : 'Edit Reply'}
              </button>
            </div>
            
            {isEditing ? (
              <textarea
                value={customReply}
                onChange={(e) => setCustomReply(e.target.value)}
                className="w-full border rounded p-2 min-h-[100px]"
                placeholder="Edit your reply here..."
              />
            ) : (
              <div className="bg-gray-100 p-3 rounded text-sm text-gray-800 min-h-[100px]">
                {generatedReply}
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 mb-4">
            <button
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              onClick={handleSendReply}
              disabled={loading}
            >
              Send Reply
            </button>
            
            <button
              className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
              onClick={() => {
                setGeneratedReply('');
                setCustomReply('');
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          
          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold mb-2">AI Quality Feedback:</h3>
            <div className="flex space-x-2">
              <button
                className="flex-1 text-green-700 border border-green-700 px-2 py-1 rounded hover:bg-green-100"
                onClick={() => handleFeedback('positive')}
                disabled={loading}
              >
                👍 Good Response
              </button>
              <button
                className="flex-1 text-red-700 border border-red-700 px-2 py-1 rounded hover:bg-red-100"
                onClick={() => handleFeedback('negative')}
                disabled={loading}
              >
                👎 Needs Improvement
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
