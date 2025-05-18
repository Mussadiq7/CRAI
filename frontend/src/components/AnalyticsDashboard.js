import React from 'react';

export default function AnalyticsDashboard({ tweets, replies }) {
  // Calculate various metrics
  const totalTweets = tweets?.length || 0;
  const totalReplies = replies?.length || 0;
  
  // Count tweets by sentiment
  const sentimentCounts = tweets?.reduce((acc, tweet) => {
    const sentiment = tweet.sentiment?.toLowerCase() || 'unknown';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {}) || {};
  
  // Calculate average response time (if timestamps are available)
  let avgResponseTime = 'N/A';
  if (replies?.length && tweets?.length) {
    const responseTimes = [];
    replies.forEach(reply => {
      const originalTweet = tweets.find(t => t.id === reply.tweet_id);
      if (originalTweet) {
        const tweetTime = new Date(originalTweet.timestamp).getTime();
        const replyTime = new Date(reply.timestamp).getTime();
        const diffInMinutes = (replyTime - tweetTime) / (1000 * 60);
        responseTimes.push(diffInMinutes);
      }
    });
    
    if (responseTimes.length > 0) {
      const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      avgResponseTime = avg.toFixed(1) + ' min';
    }
  }
  
  // Calculate customer satisfaction from feedback
  const positiveFeedback = replies?.filter(r => r.feedback === 'positive').length || 0;
  const satisfactionRate = totalReplies > 0 ? 
    Math.round((positiveFeedback / totalReplies) * 100) + '%' : 'N/A';
  
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">Engagement Analytics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tweets" value={totalTweets} />
        <StatCard title="Total Replies" value={totalReplies} />
        <StatCard title="Avg Response Time" value={avgResponseTime} />
        <StatCard title="Satisfaction Rate" value={satisfactionRate} />
      </div>
      
      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Sentiment Distribution</h3>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {renderSentimentBar('positive', sentimentCounts.positive, totalTweets, 'bg-green-500')}
          {renderSentimentBar('neutral', sentimentCounts.neutral, totalTweets, 'bg-gray-400')}
          {renderSentimentBar('negative', sentimentCounts.negative, totalTweets, 'bg-red-500')}
          {renderSentimentBar('urgent', sentimentCounts.urgent, totalTweets, 'bg-orange-500')}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <div className="flex items-center"><span className="w-3 h-3 inline-block bg-green-500 mr-1 rounded-sm"></span> Positive</div>
          <div className="flex items-center"><span className="w-3 h-3 inline-block bg-gray-400 mr-1 rounded-sm"></span> Neutral</div>
          <div className="flex items-center"><span className="w-3 h-3 inline-block bg-red-500 mr-1 rounded-sm"></span> Negative</div>
          <div className="flex items-center"><span className="w-3 h-3 inline-block bg-orange-500 mr-1 rounded-sm"></span> Urgent</div>
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-medium mb-2">Recent Activity</h3>
        <div className="text-sm text-gray-600">
          {replies && replies.length > 0 ? (
            <ul className="space-y-2">
              {replies.slice(0, 5).map((reply, index) => {
                const tweet = tweets.find(t => t.id === reply.tweet_id);
                return (
                  <li key={index} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span>Replied to {tweet?.username || 'a user'}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {reply.feedback && (
                      <span className={`text-xs ${reply.feedback === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                        Feedback: {reply.feedback === 'positive' ? 'Positive' : 'Needs improvement'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border">
      <h3 className="text-xs font-medium text-gray-500">{title}</h3>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function renderSentimentBar(sentiment, count = 0, total = 0, bgColor) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  if (percentage < 3 && count > 0) {
    // Ensure all segments with at least one tweet are visible
    return <div className={`${bgColor} min-w-[3%] text-xs text-white text-center`}>{count}</div>;
  }
  return percentage > 0 ? (
    <div 
      className={`${bgColor} text-xs text-white text-center`} 
      style={{ width: `${percentage}%` }}
    >
      {count}
    </div>
  ) : null;
}
