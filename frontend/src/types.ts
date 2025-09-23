export type ReportType = "Chest CT" | "Abdomen CT" | "Foot MRI" | "Shoulder MRI";

export interface ReportTemplate {
    report_type: ReportType;
    template_text: string | null;
}