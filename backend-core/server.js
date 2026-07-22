import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { signup, login, forgotPassword } from './authentication/authController.js';
import { runSuiteOrchestrator } from './authentication/evalController.js';
import { getDashboardMetrics, getEvaluationDetails } from './dashboard/dashboardController.js';
import { fetchTelemetryTraces } from './monitoring/telemetryTracker.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic In-Memory Log Store (No Fake Fallbacks)
global.liveSystemLogs = global.liveSystemLogs || [
  `[${new Date().toLocaleTimeString()}] INFO: System Gateway Initialized.`
];

// CORS & Middleware Config
app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Authentication Routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);

// 2. Evaluation Suite Orchestrator Route
app.post('/api/eval/run', (req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  global.liveSystemLogs.push(`[${timestamp}] EVALUATION_RUN: Executing test suite for prompt...`);
  if (global.liveSystemLogs.length > 20) global.liveSystemLogs.shift();
  runSuiteOrchestrator(req, res, next);
});

// 3. Dashboard Analytics & Metrics Routes
app.get('/api/dashboard/metrics', getDashboardMetrics);
app.get('/api/dashboard/evaluation-details', getEvaluationDetails);

// 4. Component Tracing & Telemetry Route (Langfuse & Arize Phoenix)
app.get('/api/v1/telemetry/traces', fetchTelemetryTraces);

// 5. GitHub Actions CI/CD Integration Endpoint (Pure Dynamic)
app.get('/api/v1/github/actions', async (req, res) => {
  try {
    const repoOwner = process.env.GITHUB_OWNER || 'kartik-singh';
    const repoName = process.env.GITHUB_REPO || 'llm-eval-cicd-pipeline';

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=5`, {
      headers: { 'User-Agent': 'LLM-Eval-Dashboard' }
    });

    if (!response.ok) {
      return res.status(200).json({ success: true, workflows: [] });
    }

    const data = await response.json();
    const workflows = (data.workflow_runs || []).map(run => ({
      job: run.name,
      actor: `commit: ${run.head_sha ? run.head_sha.substring(0, 7) : 'main'}`,
      status: run.status === "completed" ? (run.conclusion || "success") : run.status
    }));

    return res.status(200).json({ success: true, workflows });
  } catch (err) {
    return res.status(200).json({ success: true, workflows: [] });
  }
});

// 6. Live Evaluation Terminal Log Stream Endpoint (Dynamic Output)
app.get('/api/v1/logs/stream', (req, res) => {
  return res.status(200).json({
    success: true,
    logs: global.liveSystemLogs
  });
});

// Gateway Readiness Status Check
app.get('/api/v1/system/status', (req, res) => {
  res.status(200).json({
    success: true,
    gateway: "ONLINE",
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`🚀 PRODUCTION GATEWAY ONLINE: 0.0.0.0:${PORT}`);
  console.log(`ARIZE PHOENIX & LANGFUSE TRACERS: LIVE LISTENING`);
  console.log(`=============================================`);
});