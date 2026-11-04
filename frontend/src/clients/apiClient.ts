import axios, { type AxiosInstance } from "axios";
import { supabase } from "@/clients/supabaseClient";
import type { ModelId, NormalTemplate, ReportType } from "@/types";

const GENERATE_URLS: Record<ModelId, string> = {
  openai: "/generate-report",
  gemini: "/generate-report-gemini",
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL as string,
    });

    this.client.interceptors.request.use(async (config) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getNormalTemplates(): Promise<NormalTemplate[]> {
    const res = await this.client.get<NormalTemplate[]>("/templates");
    return res.data;
  }

  async saveNormalTemplate(report_type: ReportType, template_text: string) {
    await this.client.post("/templates", { report_type, template_text });
  }

  async generateReport(
    model: ModelId,
    report_type: ReportType,
    findings: string,
  ): Promise<string> {
    const res = await this.client.post<{ report_text: string }>(
      GENERATE_URLS[model],
      {
        report_type,
        radiologist_input: findings,
      },
    );
    return res.data.report_text;
  }
}

export const api = new ApiClient();
