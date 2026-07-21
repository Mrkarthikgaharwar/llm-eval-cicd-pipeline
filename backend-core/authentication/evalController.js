import { supabase } from '../config/config.js';
import { executeInference, calculateEvaluationMetrics } from '../utils/evalEngine.js';

export async function runSuiteOrchestrator(req, res) {
  try {
    const { prompt, modelConfig, groundTruth } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required for evaluation execution.' });
    }

    const selectedModel = modelConfig?.model || 'gemini-1.5-pro';
    console.log(`[ORCHESTRATOR] Initiating test run for model: ${selectedModel}`);

    // 1. Multi-LLM Inference Execution
    const inferenceResult = await executeInference(prompt, modelConfig);

    // 2. Metrics Calculation (G-Eval, Hallucination, Faithfulness, Security)
    const metrics = calculateEvaluationMetrics(prompt, inferenceResult.output, groundTruth);

    // 3. Log to Supabase Database
    const { data: logEntry, error: dbError } = await supabase
      .from('evaluation_logs')
      .insert([
        {
          prompt_text: prompt,
          response_output: inferenceResult.output,
          model_name: selectedModel,
          accuracy: metrics.accuracy,
          geval_cot_score: metrics.gEvalCoTScore,
          hallucination_score: metrics.hallucinationScore,
          faithfulness_score: metrics.faithfulnessScore,
          answer_relevance: metrics.answerRelevanceScore,
          security_score: metrics.securityScore,
          log_level: metrics.verdict === 'PASSED' ? 'SUCCESS' : 'FAILED',
          message: `Evaluation run completed for ${selectedModel}. Verdict: ${metrics.verdict}`
        }
      ])
      .select();

    if (dbError) {
      console.warn("[ORCHESTRATOR WARN] DB Log Insert Warning:", dbError.message);
    }

    return res.status(200).json({
      success: true,
      provider: inferenceResult.provider,
      model: selectedModel,
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