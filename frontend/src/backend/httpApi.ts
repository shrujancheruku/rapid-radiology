import axios from "axios";
import type { Api, AuthService } from "@/backend/types";
import type { ModelId, NormalTemplate } from "@/types";

const GENERATE_URLS: Record<ModelId, string> = {
  openai: "/generate-report",
  gemini: "/generate-report-gemini",
};

/** Side-effect free: nothing runs until the factory is called. */
export function createHttpApi(auth: AuthService): Api {
  const baseURL = import.meta.env.VITE_API_URL;
  if (!baseURL) {
    throw new Error("VITE_API_URL must be set (or build with --mode demo).");
  }
  const client = axios.create({ baseURL });

  client.interceptors.request.use(async (config) => {
    const token = await auth.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return {
    async getNormalTemplates() {
      const res = await client.get<NormalTemplate[]>("/templates");
      return res.data;
    },

    async saveNormalTemplate(report_type, template_text) {
      await client.post("/templates", { report_type, template_text });
    },

    async generateReport(model, report_type, findings) {
      const res = await client.post<{ report_text: string }>(
        GENERATE_URLS[model],
        { report_type, radiologist_input: findings },
      );
      return res.data.report_text;
    },
  };
}
