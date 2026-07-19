import { runEvaluationSuite } from '../utils/evalEngine.js';
import { captureTraceLog } from '../monitoring/telemetryTracker.js';

// Controller handler to orchestrate advanced evaluation metrics with enterprise telemetry logging
export const runSuiteOrchestrator = async (req, res) => {
  const { testCases, modelConfig } = req.body;
  
  // 1. Capture dynamic Input Telemetry Trace Logging
  const initialTraceId = await captureTraceLog(
    'EvaluationOrchestrator', 
    'PIPELINE_INITIATION', 
    { totalCases: testCases?.length || 0, modelConfig }, 
    null
  );

  try {
    if (!testCases || !modelConfig || !Array.isArray(testCases)) {
      const errorMsg = "Missing or invalid orchestration parameters: testCases (array) and modelConfig are required.";
      await captureTraceLog('EvaluationOrchestrator', 'VALIDATION_FAILURE', req.body, { error: errorMsg }, 'FAILED');
      return res.status(400).json({ error: errorMsg });
    }

    // Invoke the analytical metrics execution pipeline
    const report = await runEvaluationSuite(testCases, modelConfig);

    // 2. Capture dynamic Output Telemetry Trace & Localization Logging
    // Includes real totalCases/passRate so the dashboard can aggregate genuine metrics.
    await captureTraceLog(
      'EvaluationOrchestrator', 
      'PIPELINE_EXECUTION_COMPLETE', 
      { traceId: initialTraceId }, 
      {
        executionSummary: {
          ...report.orchestrationConfig,
          totalCases: report.summary.totalCases,
          passRate: report.summary.passRate
        },
        // Per-case metrics (faithfulness, hallucination, coherence, etc.) so the
        // dashboard can render real G-Eval / hallucination tables instead of mock data.
        caseResults: report.results.map((r) => ({
          input: (r.input || '').slice(0, 80),
          metrics: r.metrics,
          verdict: r.quality_gates.verdict
        })),
        status: 'PROCESSED'
      }
    );

    return res.status(200).json({ status: "success", traceId: initialTraceId, report });
  } catch (error) {
    await captureTraceLog('EvaluationOrchestrator', 'RUNTIME_EXECUTION_CRASH', { traceId: initialTraceId }, { fatalError: error.message }, 'FAILED');
    return res.status(500).json({ error: error.message });
  }
};