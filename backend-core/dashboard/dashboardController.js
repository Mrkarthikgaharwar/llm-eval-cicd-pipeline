import { supabase } from '../config/config.js';
import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'pipeline_telemetry_traces.json');

/**
 * Fetches real production analytics metrics for the dashboard's top summary
 * cards. Every field below is derived from either Supabase or the local
 * telemetry trace log — nothing here is hardcoded or randomly generated.
 *
 * Response shape (matches what Dashboard.html's fetchPipelineMetrics expects):
 * {
 *   total_evaluations: number,   // sum of test cases actually run via /api/eval/run
 *   average_accuracy: number,    // mean quality-gate pass rate across completed runs
 *   active_pipelines: number,    // distinct model configs evaluated
 *   metricsCounters: { registeredUsersCount, activeTelemetryTracesStored }
 * }
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Real registered user count from Supabase (no fake fallback number)
    let totalPlatformUsers = 0;
    try {
      const { count: fetchedUserCount, error: userCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (!userCountError && fetchedUserCount !== null) {
        totalPlatformUsers = fetchedUserCount;
      } else {
        console.warn('⚠️ [DASHBOARD AGENT] Supabase user count query returned an error; defaulting to 0.');
      }
    } catch (fetchNetworkError) {
      console.error('⚠️ [DASHBOARD NETWORKING] Could not reach Supabase for user count:', fetchNetworkError.message);
    }

    // 2. Read local telemetry trace log (written by telemetryTracker.js)
    let traceDataEntries = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      const dataContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
      traceDataEntries = JSON.parse(dataContent || '[]');
    }

    const completedEvalTraces = traceDataEntries.filter(
      (t) => t.component === 'EvaluationOrchestrator' && t.action === 'PIPELINE_EXECUTION_COMPLETE'
    );
    const initiationTraces = traceDataEntries.filter(
      (t) => t.component === 'EvaluationOrchestrator' && t.action === 'PIPELINE_INITIATION'
    );

    // 3. Total Evaluations = sum of test cases across all completed eval runs
    const totalEvaluations = completedEvalTraces.reduce((sum, t) => {
      const casesInRun = t.payloads?.output?.executionSummary?.totalCases || 0;
      return sum + casesInRun;
    }, 0);

    // 4. Average Accuracy = mean quality-gate pass rate across completed eval runs
    const passRates = completedEvalTraces
      .map((t) => t.payloads?.output?.executionSummary?.passRate)
      .filter((rate) => typeof rate === 'number');
    const averageAccuracy = passRates.length > 0
      ? parseFloat((passRates.reduce((a, b) => a + b, 0) / passRates.length).toFixed(2))
      : 0;

    // 5. Active Pipelines = distinct models actually evaluated
    const distinctModels = new Set(
      initiationTraces
        .map((t) => t.payloads?.input?.modelConfig?.model)
        .filter(Boolean)
    );
    const activePipelines = distinctModels.size;

    const productionAnalyticsPayload = {
      systemHealthStatus: "OPERATIONAL",
      total_evaluations: totalEvaluations,
      average_accuracy: averageAccuracy,
      active_pipelines: activePipelines,
      metricsCounters: {
        registeredUsersCount: totalPlatformUsers,
        activeTelemetryTracesStored: traceDataEntries.length
      }
    };

    console.log('[DASHBOARD CONTROLLER] Dispatched real aggregated dashboard metrics.');
    return res.status(200).json(productionAnalyticsPayload);
  } catch (error) {
    console.error('[DASHBOARD CRASH] Failed to compute dashboard metrics:', error.message);
    return res.status(500).json({ error: "Analytical metrics extraction failed.", detail: error.message });
  }
};

/**
 * Real (non-mock) evaluation detail data for the G-Eval table, the
 * hallucination/faithfulness/relevance table, the historical accuracy
 * trend chart, and the model comparison tool. Everything here is derived
 * from the local telemetry trace log — if no evaluations have run yet,
 * each section comes back as an empty array rather than fabricated rows.
 */
export const getEvaluationDetails = async (req, res) => {
  try {
    let traceDataEntries = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      const dataContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
      traceDataEntries = JSON.parse(dataContent || '[]');
    }

    const completedEvalTraces = traceDataEntries
      .filter((t) => t.component === 'EvaluationOrchestrator' && t.action === 'PIPELINE_EXECUTION_COMPLETE')
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // ---- G-Eval table + Hallucination/Faithfulness/Relevance table: from the latest run ----
    let gEvalMetrics = [];
    let hallucinationTable = [];

    const latestRun = completedEvalTraces[completedEvalTraces.length - 1];
    const latestCases = latestRun?.payloads?.output?.caseResults || [];

    if (latestCases.length > 0) {
      const avg = (key) =>
        parseFloat((latestCases.reduce((sum, c) => sum + (c.metrics?.[key] || 0), 0) / latestCases.length).toFixed(2));

      gEvalMetrics = [
        {
          criteria: 'Coherence / Flow',
          score: avg('coherence'),
          verdict: avg('coherence') >= 0.7 ? 'Passed' : 'Needs Review',
          text: `Averaged across ${latestCases.length} case(s) from the most recent evaluation run.`
        },
        {
          criteria: 'Conciseness',
          score: avg('conciseness'),
          verdict: avg('conciseness') >= 0.7 ? 'Passed' : 'Needs Review',
          text: `Averaged across ${latestCases.length} case(s) from the most recent evaluation run.`
        },
        {
          criteria: 'Safety & Toxicity',
          score: avg('safety'),
          verdict: avg('safety') >= 0.7 ? 'Passed' : 'Needs Review',
          text: `Averaged across ${latestCases.length} case(s) from the most recent evaluation run.`
        }
      ];

      const modelName = latestRun?.payloads?.output?.executionSummary?.modelConfig?.model || 'unknown-model';
      hallucinationTable = latestCases.map((c, idx) => ({
        target: `${modelName} — case ${idx + 1}`,
        faithfulness: ((c.metrics?.faithfulness || 0) * 100).toFixed(1) + '%',
        answerRelevance: ((c.metrics?.answer_relevance || 0) * 100).toFixed(1) + '%',
        status: c.verdict === 'PASSED' ? 'Passed' : 'Warning'
      }));
    }

    // ---- Performance trend: real pass-rate history across all runs ----
    const performanceTrend = completedEvalTraces.map((t) => ({
      date: t.timestamp ? t.timestamp.slice(0, 10) : 'unknown',
      accuracy: t.payloads?.output?.executionSummary?.passRate ?? 0
    }));

    // ---- Model comparison: real average accuracy + case count per model actually evaluated ----
    const modelStats = {};
    completedEvalTraces.forEach((t) => {
      const model = t.payloads?.output?.executionSummary?.modelConfig?.model;
      const passRate = t.payloads?.output?.executionSummary?.passRate;
      const cases = t.payloads?.output?.executionSummary?.totalCases || 0;
      if (!model) return;
      if (!modelStats[model]) modelStats[model] = { totalPassRateSum: 0, runs: 0, totalCases: 0 };
      modelStats[model].totalPassRateSum += (passRate || 0);
      modelStats[model].runs += 1;
      modelStats[model].totalCases += cases;
    });
    const modelComparison = Object.entries(modelStats).map(([model, stat]) => ({
      model,
      averageAccuracy: parseFloat((stat.totalPassRateSum / stat.runs).toFixed(2)),
      totalCasesRun: stat.totalCases
    }));

    return res.status(200).json({
      gEvalMetrics,
      hallucinationTable,
      performanceTrend,
      modelComparison
    });
  } catch (error) {
    console.error('[DASHBOARD CRASH] Failed to compute evaluation details:', error.message);
    return res.status(500).json({ error: "Evaluation detail extraction failed.", detail: error.message });
  }
};
