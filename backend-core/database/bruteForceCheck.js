// Local memory store to track login attempts per IP
const trackingStore = new Map();

// Middleware rule to orchestrate basic rate-limiting security
export const bruteForceCheck = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
  const currentTime = Date.now();
  const ruleWindowMs = 15 * 60 * 1000; // 15 Minute window
  const maximumAttemptsAllowed = 5;

  if (!trackingStore.has(clientIp)) {
    trackingStore.set(clientIp, []);
  }

  // Filter and retain only attempts within the current rolling window
  const requestHistory = trackingStore.get(clientIp).filter(timestamp => (currentTime - timestamp) < ruleWindowMs);
  
  if (requestHistory.length >= maximumAttemptsAllowed) {
    return res.status(429).json({
      error: "Too many authentication attempts from this endpoint. Account access temporarily throttled for 15 minutes."
    });
  }

  // Register current attempt stamp and proceed along pipeline chain
  requestHistory.push(currentTime);
  trackingStore.set(clientIp, requestHistory);
  next();
};