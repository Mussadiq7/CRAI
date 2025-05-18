// AI Social - Twitter/X Community Engagement Bot
// Solution for Hack-celerate 2025 challenge

import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Import components
import Navigation from './components/Navigation';
import TweetList from './components/TweetList';
import ReplyGenerator from './components/ReplyGenerator';
import BrandSettings from './components/BrandSettings';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tweets, setTweets] = useState([]);
  const [replies, setReplies] = useState([]);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [brandSettings, setBrandSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoMode, setAutoMode] = useState(false);

  // Load tweets, replies, and brand settings on initial load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch tweets
        const tweetsRes = await axios.get(`${API_BASE_URL}/tweets`);
        setTweets(tweetsRes.data.tweets || tweetsRes.data || []);
        
        // Fetch brand settings
        try {
          const settingsRes = await axios.get(`${API_BASE_URL}/brand-settings`);
          if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
            setBrandSettings(settingsRes.data);
          }
        } catch (settingsErr) {
          // Settings might not exist yet - that's ok
          console.log('No brand settings found');
        }
        
        // Fetch reply history
        try {
          const repliesRes = await axios.get(`${API_BASE_URL}/replies`);
          setReplies(repliesRes.data || []);
        } catch (repliesErr) {
          console.log('No reply history found');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Poll for new tweets when auto mode is on
  useEffect(() => {
    let interval;
    
    if (autoMode && brandSettings?.autoReplyEnabled) {
      interval = setInterval(() => {
        // Auto-fetch new tweets
        axios.get(`${API_BASE_URL}/tweets`)
          .then(res => {
            const newTweets = res.data.tweets || res.data || [];
            setTweets(prev => {
              // Check if there are any new tweets
              const existingIds = new Set(prev.map(t => t.id));
              const trulyNewTweets = newTweets.filter(t => !existingIds.has(t.id));
              
              // If we have new tweets that need responses, process the first one
              if (trulyNewTweets.length > 0) {
                const tweetToReply = trulyNewTweets[0];
                handleAutoReply(tweetToReply);
              }
              
              return [...prev, ...trulyNewTweets];
            });
          })
          .catch(err => console.error('Error polling tweets:', err));
      }, 30000); // Poll every 30 seconds
    }
    
    return () => clearInterval(interval);
  }, [autoMode, brandSettings]);

  // Handle auto reply to a tweet
  const handleAutoReply = async (tweet) => {
    if (!tweet || !brandSettings) return;
    
    try {
      // Generate AI reply
      const generateRes = await axios.post(`${API_BASE_URL}/generate-reply`, {
        tweet_id: tweet.id,
        tweet_text: tweet.text,
        tone: brandSettings.defaultTone,
        brand_name: brandSettings.brandName,
        industry: brandSettings.industry
      });
      
      const generatedReply = generateRes.data.reply;
      
      // Send the reply
      if (generatedReply) {
        const replyRes = await axios.post(`${API_BASE_URL}/tweets/${tweet.id}/thread`, {
          username: `@${brandSettings.brandName || 'brand'}_support`,
          text: generatedReply,
          timestamp: new Date().toISOString(),
          auto_generated: true
        });
        
        // Update reply history
        setReplies(prev => [
          ...prev, 
          {
            tweet_id: tweet.id,
            text: generatedReply,
            timestamp: new Date().toISOString(),
            auto_generated: true
          }
        ]);
      }
    } catch (err) {
      console.error('Error in auto-reply process:', err);
    }
  };

  // Handle selecting a tweet
  const handleSelectTweet = (tweet) => {
    setSelectedTweet(tweet);
    setActiveTab('tweets'); // Switch to tweets tab when selecting a tweet
  };

  // Handle saving brand settings
  const handleSaveSettings = (settings) => {
    setBrandSettings(settings);
    setActiveTab('dashboard'); // Return to dashboard after saving settings
  };

  // Handle reply being sent
  const handleReplySent = (updatedTweet) => {
    // Update the tweets with the new reply
    setTweets(prev => 
      prev.map(t => t.id === updatedTweet.id ? updatedTweet : t)
    );
    
    // Add to reply history
    const newReply = {
      tweet_id: updatedTweet.id,
      text: updatedTweet.thread[updatedTweet.thread.length - 1],
      timestamp: new Date().toISOString()
    };
    
    setReplies(prev => [...prev, newReply]);
    
    // Reset selected tweet
    setSelectedTweet(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AI Social - Twitter Engagement Bot</h1>
            <p className="text-gray-600">Automatically engage with your Twitter audience</p>
          </div>
          
          {brandSettings && (
            <div className="mt-2 md:mt-0 flex items-center">
              <span className="mr-2 text-sm font-medium">Auto-Reply:</span>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={autoMode}
                  onChange={() => setAutoMode(!autoMode)}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ms-2 text-sm font-medium text-gray-700">{autoMode ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          )}
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {!brandSettings ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Welcome to AI Social!</h3>
                <p className="text-yellow-700 mb-3">To get started, please configure your brand settings.</p>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  onClick={() => setActiveTab('settings')}
                >
                  Configure Settings
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-xl shadow">
                  <h2 className="text-lg font-semibold mb-2">Brand Profile</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Brand Name</p>
                      <p className="font-medium">{brandSettings.brandName}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-medium">{brandSettings.industry}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Default Tone</p>
                      <p className="font-medium">{brandSettings.defaultTone}</p>
                    </div>
                  </div>
                </div>

                <AnalyticsDashboard tweets={tweets} replies={replies} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Recent Tweets</h2>
                    {isLoading ? (
                      <div className="bg-white p-4 rounded-xl shadow flex justify-center items-center h-40">
                        <p className="text-gray-500">Loading tweets...</p>
                      </div>
                    ) : tweets.length > 0 ? (
                      <div className="bg-white p-4 rounded-xl shadow max-h-80 overflow-y-auto">
                        {tweets.slice(0, 5).map(tweet => (
                          <div key={tweet.id} className="p-3 border-b last:border-0 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm">{tweet.username}</span>
                              <span className="text-xs text-gray-400">{new Date(tweet.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm text-gray-800 mt-1">{tweet.text}</p>
                            <div className="flex justify-end mt-2">
                              <button
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => handleSelectTweet(tweet)}
                              >
                                View & Reply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl shadow text-center py-16">
                        <p className="text-gray-500">No tweets available</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Monitored Keywords</h2>
                    <div className="bg-white p-4 rounded-xl shadow">
                      {brandSettings.keywords && brandSettings.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {brandSettings.keywords.map(keyword => (
                            <span key={keyword} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-4 text-gray-500">No keywords configured</p>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-800"
                          onClick={() => setActiveTab('settings')}
                        >
                          Edit Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tweets & Reply View */}
        {activeTab === 'tweets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TweetList 
              tweets={tweets} 
              onSelectTweet={handleSelectTweet} 
              selectedTweetId={selectedTweet?.id} 
              isLoading={isLoading} 
            />
            
            <ReplyGenerator 
              tweet={selectedTweet} 
              brandSettings={brandSettings} 
              onReplySent={handleReplySent} 
            />
          </div>
        )}

        {/* Brand Settings View */}
        {activeTab === 'settings' && (
          <BrandSettings 
            onSave={handleSaveSettings} 
            onCancel={() => setActiveTab('dashboard')} 
          />
        )}

        {/* Reply History View */}
        {activeTab === 'history' && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Reply History</h2>
            
            {replies && replies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tweet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reply</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {replies.map((reply, index) => {
                      const tweet = tweets.find(t => t.id === reply.tweet_id);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{tweet?.text || 'Unknown tweet'}</div>
                            <div className="text-xs text-gray-500">{tweet?.username || 'Unknown user'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">{reply.text}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(reply.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              reply.auto_generated 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {reply.auto_generated ? 'Auto' : 'Manual'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No reply history available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
