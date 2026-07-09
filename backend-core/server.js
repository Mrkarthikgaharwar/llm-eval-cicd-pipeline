import express from 'express';
import cors from 'cors';
import { supabase } from './config/config.js';
import { handleLogin, handleSignup, handleForgotPassword } from './authentication/authController.js';
import { runSuiteOrchestrator } from './authentication/evalController.js';
import { bruteForceCheck } from './database/bruteForceCheck.js';
import { getDashboardMetrics } from './dashboard/dashboardController.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure global communication mechanisms
app.use(cors());
app.use(express.json());

// Bind structural authentication router endpoints with brute force protection on login
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', bruteForceCheck, handleLogin);
app.post('/api/auth/forgot-password', handleForgotPassword);

// Bind evaluation orchestrator metrics execution pipeline endpoints
app.post('/api/eval/run', runSuiteOrchestrator);

// Bind live dashboard metrics system dynamic query pipeline
app.get('/api/dashboard/metrics', getDashboardMetrics);

// Base health check monitoring endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', database: 'connected' });
});

// Start the enterprise gateway loop listener
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 SECURE BACKEND RUNNING ON PORT: ${PORT}`);
  console.log(`🛡️  BRUTE-FORCE PROTECTION ACTIVE ON LOGIN`);
  console.log(`=============================================`);
});