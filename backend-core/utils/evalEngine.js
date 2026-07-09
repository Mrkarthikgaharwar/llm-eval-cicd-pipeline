import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

// Strict API compliance guardrail check configuration layer
if (!apiKey) {
  console.warn("⚠️ [ENGINE WARNING] GEMINI_API_KEY environment binding is not provisioned. Fallback prompt evaluation sequences will run mock vectors.");
}

// Instantiate the enterprise-grade automated Google AI SDK client architecture context
const ai = new GoogleGenAI({ apiKey: apiKey || 'MOCK_DEVELOPMENT_ENVIRONMENT_KEY_2026' });

/**
 * CALCULATE RAGAS FAITHFULNESS METRIC VIA REAL GEMINI EXTRACTION
 * Strictly measures if the response is perfectly grounded in the provided context vector.
 */
export const calculateRagasFaithfulness = async (response, context) => {
  if (!response || !context) return 0.0;
  
  try {
    const cleanPrompt = `
      You are an enterprise system evaluating response faithfulness based strictly on context coordinates.
      Analyze the provided Response and context dataset below.
      
      [CONTEXT DATASET]:
      "${context}"
      
      [EVALUATION RESPONSE]:
      "${response}"
      
      Task: Output a raw JSON structure matching exactly this format: {"score": <float between 0.0 and 1.0>}.
      The score reflects the fractional density of factual statements inside the response that are directly verified by the context dataset.
      Do not return markdown, do not write prose. Return only raw parsable JSON.
    `;

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanPrompt,
    });

    const outputText = modelResponse.text?.trim() || '{}';
    // Clean potential markdown wrap responses cleanly
    const jsonCleaned = outputText.replace(/```json|```/g, '').trim();
    const resultData = JSON.parse(jsonCleaned);
    
    const parsedScore = parseFloat(resultData.score);
    return isNaN(parsedScore) ? 0.0 : Math.max(0.0, Math.min(1.0, parsedScore));
  } catch (error) {
    console.error('[METRIC CRASH] Ragas Faithfulness calculation engine failed:', error.message);
    return 0.5; // Secure baseline index processing failure localization indicator
  }
};

/**
 * CALCULATE DEEPEVAL HALLUCINATION METRIC VIA REAL GEMINI ANALYSIS
 * Strictly monitors if the response introduces outside alignment anomalies contradicting reference constraints.
 */
export const calculateDeepEvalHallucination = async (response, reference) => {
  if (!response || !reference) return 1.0;

  try {
    const cleanPrompt = `
      You are an automated evaluation orchestrator quality gate auditing system logs for hallucination anomalies.
      Cross-examine the response text alignment parameters relative to the specified structural reference criteria constraints.
      
      [STRUCTURAL REFERENCE CRITERIA]:
      "${reference}"
      
      [AUDIT SYSTEM LOG RESPONSE]:
      "${response}"
      
      Task: Output a raw JSON object string matching exactly this scheme: {"hallucinationIndex": <float between 0.0 and 1.0>}.
      A score of 1.0 means full contradiction/hallucination. A score of 0.0 means perfect alignment integrity.
      Do not return anything except raw valid JSON text structure.
    `;

    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanPrompt,
    });

    const outputText = modelResponse.text?.trim() || '{}';
    const jsonCleaned = outputText.replace(/```json|```/g, '').trim();
    const resultData = JSON.parse(jsonCleaned);
    
    const parsedIndex = parseFloat(resultData.hallucinationIndex);
    return isNaN(parsedIndex) ? 1.0 : Math.max(0.0, Math.min(1.0, parsedIndex));
  } catch (error) {
    console.error('[METRIC CRASH] DeepEval Hallucination engine runtime failure:', error.message);
    return 1.0; // Secure absolute exception flag localization indicator
  }
};

/**
 * RUN COMPLETE EVALUATION SUITE ORCHESTRATION PIPELINE
 */
export const runEvaluationSuite = async (testCases, modelConfig) => {
  console.log(`[EVALUATION ENGINE] Initializing operational metrics suite pipeline for ${testCases?.length || 0} configurations.`);
  
  let successfulEvaluationsCount = 0;
  
  for (const testCase of testCases) {
    const faithfulness = await calculateRagasFaithfulness(testCase.response, testCase.context);
    const hallucination = await calculateDeepEvalHallucination(testCase.response, testCase.reference);
    
    if (faithfulness >= 0.7 && hallucination <= 0.3) {
      successfulEvaluationsCount++;
    }
  }

  return {
    orchestrationConfig: {
      activeModelTarget: modelConfig?.model || 'gemini-2.5-flash',
      totalScoredCases: testCases?.length || 0,
      passingCasesIndex: successfulEvaluationsCount
    },
    metricsSummaryReport: {
      status: successfulEvaluationsCount === testCases?.length ? 'EXCELLENT_GROUNDING' : 'COVERAGE_ANOMALIES_DETECTED'
    }
  };
};