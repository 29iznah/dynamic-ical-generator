// This file should be saved as: netlify/functions/track-download.js

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { eventTitle, downloadType } = JSON.parse(event.body);
    const timestamp = new Date().toISOString();
    
    // Create download record
    const downloadRecord = {
      timestamp,
      eventTitle,
      downloadType,
      userAgent: event.headers['user-agent'] || 'Unknown',
      referrer: event.headers.referer || 'Direct'
    };

    // In a real implementation, you'd save to a database
    // For now, we'll use Netlify's environment or return success
    console.log('Download tracked:', downloadRecord);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Download tracked successfully',
        data: downloadRecord
      })
    };
    
  } catch (error) {
    console.error('Error tracking download:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to track download' 
      })
    };
  }
};
