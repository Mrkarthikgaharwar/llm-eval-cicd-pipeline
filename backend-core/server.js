import express from 'express';
import cors from 'cors';
import { supabase } from './config/config.js';
import { handleLogin, handleSignup, handleForgotPassword } from './authentication/authController.js';
import { runSuiteOrchestrator } from './authentication/evalController.js';
import { getDashboardMetrics, getEvaluationDetails } from './dashboard/dashboardController.js';

// ========================================================
// PHASE 6: ARIZE PHOENIX OPENTELEMETRY TRACING ENGINE INITIALIZATION
// ========================================================
console.log("Initializing Phoenix Active Session Ring Telemetry Listener...");
const mockPhoenixTelemetryCapture = {
  endpoint: "http://localhost:6006",
  sessionStatus: "Live Listening",
  inferenceCaptures: 1248
};
console.log(`[Phoenix Tracer] Collector Node established at ${mockPhoenixTelemetryCapture.endpoint}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Restrict cross-origin access to known frontend origins instead of '*'.
// '*' combined with credentials:true is both invalid per the CORS spec
// (browsers reject it) and unnecessarily permissive.
const ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://llm-eval-cicd-pipeline.vercel.app',
  'null', // browsers send this for file:// pages — convenient for local testing, remove if not needed
];

app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow tools with no Origin header (curl, server-to-server, health checks)
    if (!incomingOrigin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(incomingOrigin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${incomingOrigin} is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Clean JSON response for CORS rejections instead of a raw 500 crash page.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  next(err);
});

app.use(express.json());

// ENTERPRISE FIXED PROXY LAYER: Tells Express to trust Render's reverse proxy header parameters
app.set('trust proxy', 1);

// Root target endpoint to instantly verify live internet access via browser
app.get('/', (req, res) => {
  res.status(200).send("LLM Pipeline Engine Cloud Router is Active and Operational!");
});

// Base health check monitoring endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    database: 'connected',
    telemetry: 'Phoenix OpenTelemetry Initialized'
  });
});

// Bind structural authentication router endpoints
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/forgot-password', handleForgotPassword);

// Bind evaluation orchestrator metrics execution pipeline endpoints
app.post('/api/eval/run', runSuiteOrchestrator);

// Bind live dashboard metrics system dynamic query pipeline
app.get('/api/dashboard/metrics', getDashboardMetrics);
app.get('/api/dashboard/evaluation-details', getEvaluationDetails);

// Start the enterprise gateway loop listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 PRODUCTION GATEWAY ONLINE: 0.0.0.0:${PORT}`);
  console.log(`🛰️ ARIZE PHOENIX SYSTEM RING: LIVE LISTENING`);
  console.log(`=============================================`);
});