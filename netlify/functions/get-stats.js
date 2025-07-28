// This file should be saved as: netlify/functions/get-stats.js

// Simple in-memory storage (resets on deployment)
// In production, you'd use a database like Airtable, Supabase, or FaunaDB
let downloadStats = [];

exports.handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    // Return current stats
    const stats = generateStats(downloadStats);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(stats, null, 2)
    };
    
  } else if (event.httpMethod === 'POST') {
    // Add new download (called from track-download function)
    try {
      const downloadData = JSON.parse(event.body);
      downloadStats.push(downloadData);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true, total: downloadStats.length })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid data' })
      };
    }
  }
  
  return { 
    statusCode: 405, 
    body: JSON.stringify({ error: 'Method not allowed' }) 
  };
};

function generateStats(downloads) {
  const now = new Date();
  const today = now.toDateString();
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Count by event title
  const eventCounts = {};
  const typeCounts = { auto_download: 0, manual_download: 0 };
  let todayCount = 0;
  let weekCount = 0;
  
  downloads.forEach(download => {
    // Count by event
    eventCounts[download.eventTitle] = (eventCounts[download.eventTitle] || 0) + 1;
    
    // Count by type
    typeCounts[download.downloadType] = (typeCounts[download.downloadType] || 0) + 1;
    
    // Count by time
    const downloadDate = new Date(download.timestamp);
    if (downloadDate.toDateString() === today) {
      todayCount++;
    }
    if (downloadDate >= thisWeek) {
      weekCount++;
    }
  });
  
  // Sort events by popularity
  const sortedEvents = Object.entries(eventCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([event, count]) => ({ event, count }));
  
  return {
    summary: {
      totalDownloads: downloads.length,
      uniqueEvents: Object.keys(eventCounts).length,
      downloadsToday: todayCount,
      downloadsThisWeek: weekCount,
      lastUpdated: new Date().toISOString()
    },
    eventBreakdown: sortedEvents,
    downloadTypes: typeCounts,
    recentDownloads: downloads.slice(-10).reverse().map(d => ({
      timestamp: d.timestamp,
      eventTitle: d.eventTitle,
      downloadType: d.downloadType,
      timeAgo: getTimeAgo(d.timestamp)
    }))
  };
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const downloadTime = new Date(timestamp);
  const diffMs = now - downloadTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
