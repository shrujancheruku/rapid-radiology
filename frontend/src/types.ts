export enum ReportType {
    CT_CHEST = "CT Chest",
    CT_ABDOMEN_PELVIS = "CT Abdomen and Pelvis",
    CT_CHEST_ABDOMEN_PELVIS = "CT Chest, Abdomen, and Pelvis",
    CT_URINARY_TRACT = "CT Urinary Tract",
    MRI_BRACHIAL_PLEXUS = "MRI Brachial Plexus",
    MRI_ELBOW = "MRI Elbow",
    MRI_FOOT = "MRI Foot",
    MRI_LEFT_HIP = "MRI Left Hip",
    MRI_RIGHT_HIP = "MRI Right Hip",
    MRI_KNEE = "MRI Knee",
    MRI_SHOULDER = "MRI Shoulder",
    MRI_CERVICAL_SPINE = "MRI Cervical Spine",
    MRI_THORACIC_SPINE = "MRI Thoracic Spine",
    MRI_LUMBAR_SPINE = "MRI Lumbar Spine",
    MRI_COCCYX = "MRI Coccyx",
}

export interface ReportTemplate {
    report_type: ReportType;
    template_text: string | null;
}