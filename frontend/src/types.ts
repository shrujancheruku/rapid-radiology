export enum ReportType {
    CHEST_CT = "Chest CT",
    ABDOMEN_CT = "Abdomen CT",
    FOOT_MRI = "Foot MRI",
    SHOULDER_MRI = "Shoulder MRI",
}

export interface ReportTemplate {
    report_type: ReportType;
    template_text: string | null;
}