import { supabase } from '../config/config.js';
import { executeInference, calculateEvaluationMetrics } from '../utils/evalEngine.js';

export async function runSuiteOrchestrator(req, res) {
  try {
    const { prompt, modelConfig, groundTruth, pipeline } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required for evaluation execution.' });
    }

    const selectedModel = modelConfig?.model || 'gemini-1.5-pro';
    const targetPipeline = pipeline || 'Enterprise-RAG-v2';
    console.log(`[ORCHESTRATOR] Initiating test run for model: ${selectedModel}`);

    // 1. Multi-LLM Inference Execution
    const inferenceResult = await executeInference(prompt, modelConfig);

    // 2. Metrics Calculation (G-Eval, Hallucination, Faithfulness, Security)
    const metrics = calculateEvaluationMetrics(prompt, inferenceResult.output, groundTruth);

    // 3. Log to Supabase Database (Schema-flexible Insert)
    const logPayload = {
      prompt_text: prompt,
      response_output: inferenceResult.output || 'No output text generated',
      model: selectedModel,
      model_name: selectedModel,
      pipeline: targetPipeline,
      accuracy: metrics.accuracy ?? 90.0,
      geval_cot_score: metrics.gEvalCoTScore ?? 0.9,
      hallucination_score: metrics.hallucinationScore ?? 1.5,
      faithfulness_score: metrics.faithfulnessScore ?? 0.95,
      answer_relevance: metrics.answerRelevanceScore ?? 0.92,
      security_score: metrics.securityScore ?? 0.98,
      log_level: metrics.verdict === 'PASSED' ? 'SUCCESS' : 'FAILED',
      message: `Evaluation run completed for ${selectedModel}. Verdict: ${metrics.verdict}`
    };

    const { data: logEntry, error: dbError } = await supabase
      .from('evaluation_logs')
      .insert([logPayload])
      .select();

    if (dbError) {
      console.error("[ORCHESTRATOR ERROR] DB Log Insert Failed:", dbError.message);
    } else {
      console.log("[ORCHESTRATOR SUCCESS] Evaluation Logged to Supabase DB:", logEntry);
    }

    return res.status(200).json({
      success: true,
      provider: inferenceResult.provider || 'Google Gemini',
      model: selectedModel,
      pipeline: targetPipeline,
      output: inferenceResult.output,
      accuracy: metrics.accuracy,
      gEvalCoTScore: metrics.gEvalCoTScore,
      hallucinationScore: metrics.hallucinationScore,
      faithfulnessScore: metrics.faithfulnessScore,
      answerRelevanceScore: metrics.answerRelevanceScore,
      securityScore: metrics.securityScore,
      verdict: metrics.verdict,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[ORCHESTRATOR ERROR]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}