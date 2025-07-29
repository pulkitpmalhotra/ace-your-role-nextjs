// /utils/feedbackCache.js
const feedbackCache = new Map();

async function getCachedFeedback(sessionId) {
  const cacheKey = `feedback:${sessionId}`;
  
  if (feedbackCache.has(cacheKey)) {
    return feedbackCache.get(cacheKey);
  }
  
  const feedback = await generateFeedback(sessionId);
  feedbackCache.set(cacheKey, feedback);
  
  // Cache for 1 hour
  setTimeout(() => feedbackCache.delete(cacheKey), 3600000);
  
  return feedback;
}

// Implement in your API route
export default async function handler(req, res) {
  const { sessionId } = req.query;
  
  try {
    // Use cached feedback if available
    const feedback = await getCachedFeedback(sessionId);
    res.status(200).json({ feedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
}
