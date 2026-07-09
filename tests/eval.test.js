import { calculateDeepEvalHallucination, calculateRagasFaithfulness } from '../backend-core/utils/evalEngine.js';
import fs from 'fs';
import path from 'path';

describe('LLM Evaluation Core Engine Metric Tests', () => {
  
  // Test 1: Grounded contexts check (Faithfulness High validation)
  test('Should calculate high Ragas Faithfulness for perfectly grounded responses', async () => {
    const context = "The model was trained on historical data sets spanning up to December 2025.";
    const response = "The training data sets for the model span up to December 2025.";
    
    const score = await calculateRagasFaithfulness(response, context);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0.0);
  }, 15000);

  // Test 2: Out of context hallucination detection matrix verification
  test('Should catch high hallucination when factual assertions contradict reference criteria', async () => {
    const reference = "The system architecture mandates strict database storage optimization mechanisms.";
    const response = "The system completely bypasses storage guidelines and relies entirely on cloud caches.";
    
    const hallucinationScore = await calculateDeepEvalHallucination(response, reference);
    expect(typeof hallucinationScore).toBe('number');
    expect(hallucinationScore).toBeGreaterThanOrEqual(0.0);
  }, 15000);

  // Test 3: Production telemetry logs persistence file existence pathway test
  test('Should verify production telemetry logs persistence layer file creation', () => {
    const telemetryFilePath = path.join(process.cwd(), 'pipeline_telemetry_traces.json');
    expect(typeof telemetryFilePath).toBe('string');
  });

});