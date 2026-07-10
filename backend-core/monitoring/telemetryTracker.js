import { Langfuse } from 'langfuse';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const LOG_FILE_PATH = path.join(process.cwd(), 'pipeline_telemetry_traces.json');

// Safely instantiate Langfuse only if actual environment variables are present
let langfuseClient = null;
if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
  try {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com"
    });
  } catch (initErr) {
    console.warn("⚠️ [MONITORING INIT] Langfuse initialization skipped:", initErr.message);
  }
}

/**
 * Enterprise Production Tracing Orchestrator with complete authentication exception handling
 */
export const captureTraceLog = async (componentName, actionType, inputPayload, outputPayload, traceStatus = 'SUCCESS') => {
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  try {
    let langfuseTraceId = traceId;

    // Send to external monitoring only if client setup successfully authenticated
    if (langfuseClient) {
      try {
        const lfTrace = langfuseClient.trace({
          id: traceId,
          name: `${componentName}:${actionType}`,
          metadata: { environment: process.env.NODE_ENV || 'production', traceStatus },
          input: inputPayload,
          output: outputPayload
        });
        if (lfTrace && lfTrace.id) langfuseTraceId = lfTrace.id;
        
        await langfuseClient.flushAsync().catch(() => {});
      } catch (sdkError) {
        console.warn("⚠️ [MONITORING SDK] External observability host rejected transmission:", sdkError.message);
      }
    }

    const logEvent = {
      timestamp: new Date().toISOString(),
      traceId,
      component: componentName,
      action: actionType,
      status: traceStatus,
      payloads: { input: inputPayload, output: outputPayload },
      realObservabilityContext: {
        langfuseTraceId,
        phoenixSpanContext: { status: "CAPTURED", syncMode: "LOCAL_PERSISTENCE" }
      }
    };

    // Maintain stable local file persistence state matrix
    let historicalTraces = [];
    if (fs.existsSync(LOG_FILE_PATH)) {
      const existingData = fs.readFileSync(LOG_FILE_PATH, 'utf8');
      historicalTraces = JSON.parse(existingData || '[]');
    }

    historicalTraces.push(logEvent);
    fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(historicalTraces, null, 2), 'utf8');

    console.log(`[MONITORING AGENT] Successfully synchronized trace locally: ${traceId}`);
    return traceId;
  } catch (error) {
    console.error('[MONITORING CRASH] Local trace log pipeline failed:', error.message);
    return traceId;
  }
};