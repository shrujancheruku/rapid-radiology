// PROTOTYPE: throwaway draft of demo seed content for "Demo seed content" (#10).
// Not wired into the app. The real file will be src/demo/seed.ts.
// All content is fictional: no patients, names, accession numbers or real dates.

import { ReportType } from "@/types";

type ModelId = "openai" | "gemini";

interface SeedEntry {
    normalTemplate: string;
    sampleFindings: string;
    reports: Record<ModelId, string>;
}

export const seed: Partial<Record<ReportType, SeedEntry>> = {
    // Mirrors the worked example in the backend prompt (appendix line rewrite).
    [ReportType.CT_ABDOMEN_PELVIS]: {
        normalTemplate: `The liver has a smooth contour.
No focal liver lesions.
Patent hepatic veins.
Patent portal vein, superior mesenteric vein and splenic vein.
The gallbladder is thin-walled.
No radio-opaque gallstones.
No biliary duct dilatation.
Normal spleen, pancreas and adrenals.
Normal kidneys and urinary bladder.
Unremarkable small and large bowel.
No free fluid or free gas.
No enlarged abdominopelvic lymph nodes.
No aggressive osseous lesions.`,
        sampleFindings: `dilated appendix 11mm with periappendiceal fat stranding, appendicolith at base
small volume free fluid in right iliac fossa
few small reactive right iliac fossa nodes
6mm simple cyst segment 7 liver`,
        reports: {
            openai: `No previous imaging available for comparison.
The liver has a smooth contour.
6 mm simple cyst in segment 7 of the liver. No other focal liver lesions.
Patent hepatic veins.
Patent portal vein, superior mesenteric vein and splenic vein.
The gallbladder is thin-walled.
No radio-opaque gallstones.
No biliary duct dilatation.
Normal spleen, pancreas and adrenals.
Normal kidneys and urinary bladder.
Dilated appendix measuring 11 mm with periappendiceal fat stranding and an appendicolith at its base. Unremarkable small bowel.
Small volume free fluid in the right iliac fossa. No free gas.
Few small reactive right iliac fossa lymph nodes. No enlarged abdominopelvic lymph nodes.
No aggressive osseous lesions.`,
            gemini: `No previous imaging available for comparison.
The liver has a smooth contour.
6mm simple cyst in liver segment 7. No other focal liver lesions.
Patent hepatic veins.
Patent portal vein, superior mesenteric vein and splenic vein.
The gallbladder is thin-walled.
No radio-opaque gallstones.
No biliary duct dilatation.
Normal spleen, pancreas and adrenals.
Normal kidneys and urinary bladder.
Dilated appendix 11mm with periappendiceal fat stranding, appendicolith at base. Unremarkable small bowel and remainder of large bowel.
Small volume free fluid in the right iliac fossa. No free gas.
Few small reactive right iliac fossa nodes. No enlarged abdominopelvic lymph nodes.
No aggressive osseous lesions.`,
        },
    },

    // Shows the "comparison date" first-line rule and a split normal line.
    [ReportType.CT_CHEST]: {
        normalTemplate: `The central airways are patent.
No focal consolidation nor suspicious lung nodules.
No pleural effusion or pneumothorax.
Normal heart size. No pericardial effusion.
Normal calibre thoracic aorta and main pulmonary artery.
No enlarged mediastinal, hilar or axillary lymph nodes.
Visualised upper abdomen unremarkable.
No aggressive osseous lesions.`,
        sampleFindings: `comparison CT chest 14 March 2025
left lower lobe consolidation with air bronchograms
small left pleural effusion
4mm right upper lobe nodule, stable from prior`,
        reports: {
            openai: `Comparison is made to previous imaging dated 14 March 2025.
The central airways are patent.
Left lower lobe consolidation with air bronchograms. 4 mm right upper lobe nodule, stable from prior. No suspicious lung nodules.
Small left pleural effusion. No pneumothorax.
Normal heart size. No pericardial effusion.
Normal calibre thoracic aorta and main pulmonary artery.
No enlarged mediastinal, hilar or axillary lymph nodes.
Visualised upper abdomen unremarkable.
No aggressive osseous lesions.`,
            gemini: `Comparison is made to previous imaging dated 14 March 2025.
The central airways are patent.
Left lower lobe consolidation with air bronchograms.
4mm right upper lobe nodule, stable from prior. No new suspicious lung nodules.
Small left pleural effusion. No pneumothorax.
Normal heart size. No pericardial effusion.
Normal calibre thoracic aorta and main pulmonary artery.
No enlarged mediastinal, hilar or axillary lymph nodes.
Visualised upper abdomen unremarkable.
No aggressive osseous lesions.`,
        },
    },

    // MSK example: several abnormalities landing in different template lines.
    [ReportType.MRI_KNEE]: {
        normalTemplate: `No joint effusion.
Intact anterior and posterior cruciate ligaments.
Intact medial and lateral collateral ligaments.
Intact medial and lateral menisci.
Intact extensor mechanism.
Preserved articular cartilage in all compartments.
No bone marrow oedema or fracture.
No Baker's cyst.`,
        sampleFindings: `moderate effusion
complete ACL tear midsubstance
oblique tear posterior horn medial meniscus extending to inferior articular surface
bone bruising lateral femoral condyle and posterolateral tibial plateau`,
        reports: {
            openai: `No previous imaging available for comparison.
Moderate joint effusion.
Complete midsubstance tear of the anterior cruciate ligament. Intact posterior cruciate ligament.
Intact medial and lateral collateral ligaments.
Oblique tear of the posterior horn of the medial meniscus extending to the inferior articular surface. Intact lateral meniscus.
Intact extensor mechanism.
Preserved articular cartilage in all compartments.
Bone bruising of the lateral femoral condyle and posterolateral tibial plateau. No fracture.
No Baker's cyst.`,
            gemini: `No previous imaging available for comparison.
Moderate effusion.
Complete ACL tear, midsubstance. Intact posterior cruciate ligament.
Intact medial and lateral collateral ligaments.
Oblique tear posterior horn medial meniscus extending to inferior articular surface. Intact lateral meniscus.
Intact extensor mechanism.
Preserved articular cartilage in all compartments.
Bone bruising lateral femoral condyle and posterolateral tibial plateau. No fracture.
No Baker's cyst.`,
        },
    },
};
