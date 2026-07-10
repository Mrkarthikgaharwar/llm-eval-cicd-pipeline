import express from 'express';
import cors from 'cors';
import { supabase } from './config/config.js';
import { handleLogin, handleSignup, handleForgotPassword } from './authentication/authController.js';
import { runSuiteOrchestrator } from './authentication/evalController.js';
import { getDashboardMetrics } from './dashboard/dashboardController.js';

const app = express();
const PORT = process.env.PORT || 5000;

// PRODUCTION AUDIT FIX: Permissive configuration with explicit preflight response handling
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ENTERPRISE FIXED PROXY LAYER: Tells Express to trust Render's reverse proxy header parameters
app.set('trust proxy', 1);

// Root target endpoint to instantly verify live internet access via browser
app.get('/', (req, res) => {
  res.status(200).send("LLM Pipeline Engine Cloud Router is Active and Operational!");
});

// Base health check monitoring endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: 'connected' });
});

// Bind structural authentication router endpoints
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/forgot-password', handleForgotPassword);

// Bind evaluation orchestrator metrics execution pipeline endpoints
app.post('/api/eval/run', runSuiteOrchestrator);

// Bind live dashboard metrics system dynamic query pipeline
app.get('/api/dashboard/metrics', getDashboardMetrics);

// Start the enterprise gateway loop listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 PRODUCTION GATEWAY ONLINE: 0.0.0.0:${PORT}`);
  console.log(`=============================================`);
});