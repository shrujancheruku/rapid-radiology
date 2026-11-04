import { createHttpApi } from "@/backend/httpApi";
import { createSupabaseAuth } from "@/backend/supabaseAuth";
import type { Api, AuthService } from "@/backend/types";
import { createDemoApi, sampleFindingsFor } from "@/demo/demoApi";
import { createDemoAuth } from "@/demo/demoAuth";
import type { ReportType } from "@/types";

// Vite inlines this at build time, so in a demo build the real factories are
// dead code and Supabase's createClient never runs (no env vars needed).
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export const auth: AuthService = DEMO_MODE
  ? createDemoAuth()
  : createSupabaseAuth();

export const api: Api = DEMO_MODE ? createDemoApi() : createHttpApi(auth);

/** Findings to pre-fill when a Report Type is chosen; empty outside demo. */
export const sampleFindings = (reportType: ReportType): string =>
  DEMO_MODE ? sampleFindingsFor(reportType) : "";
