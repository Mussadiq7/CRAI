import React from 'react';

export default function TweetList({ tweets, onSelectTweet, selectedTweetId, isLoading }) {
  // Sort tweets by timestamp (newest first)
  const sortedTweets = [...tweets].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Incoming Tweets</h2>
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-500">Loading tweets...</p>
        </div>
      </div>
    );
  }

  if (sortedTweets.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Incoming Tweets</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No tweets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2">Incoming Tweets</h2>
      <div className="max-h-[500px] overflow-y-auto pr-2">
        {sortedTweets.map(tweet => (
          <div
            key={tweet.id}
            className={`p-3 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors ${selectedTweetId === tweet.id ? 'bg-blue-100 border-blue-300' : ''}`}
            onClick={() => onSelectTweet(tweet)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm">{tweet.username}</span>
              <span className="text-xs text-gray-400">
                {new Date(tweet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-800 mb-2">{tweet.text}</p>
            <div className="flex justify-between items-center">
              <div className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(tweet.sentiment)}`}>
                {tweet.sentiment.charAt(0).toUpperCase() + tweet.sentiment.slice(1)}
              </div>
              {tweet.thread && tweet.thread.length > 0 && (
                <div className="text-xs text-gray-500">
                  {tweet.thread.length} {tweet.thread.length === 1 ? 'reply' : 'replies'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSentimentColor(sentiment) {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'negative':
      return 'bg-red-100 text-red-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
    case 'urgent':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
