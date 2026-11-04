export enum ReportType {
    CT_CHEST = "CT Chest",
    CT_ABDOMEN_PELVIS = "CT Abdomen and Pelvis",
    CT_CHEST_ABDOMEN_PELVIS = "CT Chest, Abdomen, and Pelvis",
    CT_URINARY_TRACT = "CT Urinary Tract",
    MRI_BRACHIAL_PLEXUS = "MRI Brachial Plexus",
    MRI_HEAD = "MRI Head",
    MRI_HAND = "MRI Hand",
    MRI_WRIST = "MRI Wrist",
    MRI_ELBOW = "MRI Elbow",
    MRI_ANKLE = "MRI Ankle",
    MRI_FOOT = "MRI Foot",
    MRI_SACROILIAC_JOINTS = "MRI Sacroiliac Joints",
    MRI_LEFT_HIP = "MRI Left Hip",
    MRI_RIGHT_HIP = "MRI Right Hip",
    MRI_KNEE = "MRI Knee",
    MRI_SHOULDER = "MRI Shoulder",
    MRI_CERVICAL_SPINE = "MRI Cervical Spine",
    MRI_THORACIC_SPINE = "MRI Thoracic Spine",
    MRI_LUMBAR_SPINE = "MRI Lumbar Spine",
    MRI_COCCYX = "MRI Coccyx",
}

export interface NormalTemplate {
    report_type: ReportType;
    template_text: string | null;
}

export type ModelId = "openai" | "gemini";