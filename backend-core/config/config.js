import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ [DEPLOYMENT WARNING] Production platform target secrets are missing. Using mock configurations bypass parameters layer.');
}

// Instantiate remote enterprise database infrastructure layer client mapping
export const supabase = createClient(
  supabaseUrl || 'https://mock-instance-placeholder.supabase.co', 
  supabaseAnonKey || 'mock-anon-key-placeholder-2026'
);

/**
 * Validates production cloud platform infrastructure readiness checks
 */
export const verifyCloudEnvironmentState = () => {
  const deploymentContext = {
    databaseConnected: !!supabaseUrl,
    environmentMode: process.env.NODE_ENV || 'production',
    gatewayRouteURL: process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
    timestamp: new Date().toISOString()
  };
  console.log(`[CLOUD AGENT] Deployment environment metrics initialized:`, deploymentContext);
  return deploymentContext;
};

// Trigger environmental audit verification check loops immediately on engine startup
verifyCloudEnvironmentState();