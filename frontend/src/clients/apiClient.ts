import axios, { type AxiosInstance } from "axios";
import type { Session } from "@supabase/supabase-js";
import { type ReportTemplate, ReportType } from "@/types";

export class ApiClient {
    private client: AxiosInstance;

    constructor(session?: Session | null) {
        const baseURL = import.meta.env.VITE_API_URL as string;

        this.client = axios.create({ baseURL });

        // Attach Authorization header automatically if session exists
        if (session && session?.access_token) {
            this.client.defaults.headers.common[
                "Authorization"
                ] = `Bearer ${session.access_token}`;
        }
    }

    // Fetch all templates for the user
    async getTemplates(): Promise<ReportTemplate[]> {
        const res = await this.client.get("/templates");
        return res.data;
    }

    // Save a template
    async saveTemplate(report_type: ReportType, template_text: string) {
        return this.client.post("/templates", { report_type, template_text });
    }

    // Generate a report using the OpenAI GPT-4 API
    async generateReport(report_type: ReportType, radiologist_input: string): Promise<string> {
        const res = await this.client.post<{ report_text: string }>("/generate-report", {
            report_type,
            radiologist_input
        });

        return res.data.report_text;
    }

    async generateGeminiReport(report_type: ReportType, radiologist_input: string): Promise<string> {
        const res = await this.client.post<{ report_text: string }>("/generate-report-gemini", {
            report_type,
            radiologist_input
        });

        return res.data.report_text;
    }
}