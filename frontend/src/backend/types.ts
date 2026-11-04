import type { ModelId, NormalTemplate, ReportType } from "@/types";

/** Our own user shape, so the app never depends on Supabase's `User`. */
export interface AppUser {
  email: string;
}

/** Port for authentication: Supabase in production, a fake in demo mode. */
export interface AuthService {
  getUser(): Promise<AppUser | null>;
  /** Calls `cb` on every sign-in or sign-out. Returns an unsubscribe. */
  onChange(cb: (user: AppUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getAccessToken(): Promise<string | null>;
}

/** Port for the backend API: HTTP in production, a seeded fake in demo mode. */
export interface Api {
  getNormalTemplates(): Promise<NormalTemplate[]>;
  saveNormalTemplate(
    report_type: ReportType,
    template_text: string,
  ): Promise<void>;
  generateReport(
    model: ModelId,
    report_type: ReportType,
    findings: string,
  ): Promise<string>;
}
