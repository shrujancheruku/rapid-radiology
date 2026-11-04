import type { Api } from "@/backend/types";
import { DEMO_PREFIX } from "@/demo/demoAuth";
import { seed } from "@/demo/seed";
import type { NormalTemplate, ReportType } from "@/types";

const TEMPLATES_KEY = `${DEMO_PREFIX}templates`;
const TEMPLATE_DELAY_MS = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Visitor edits only; the seed underneath is never written. */
function readEdits(): Partial<Record<ReportType, string>> {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<ReportType, string>>) : {};
  } catch {
    return {};
  }
}

/** Normal Template for a Report Type: the visitor's edit, else the seed. */
function normalTemplateFor(reportType: ReportType): string | undefined {
  return readEdits()[reportType] ?? seed[reportType]?.normalTemplate;
}

/** Sample Findings that pre-fill the Findings box (demo only). */
export function sampleFindingsFor(reportType: ReportType): string {
  return seed[reportType]?.sampleFindings ?? "";
}

export function createDemoApi(): Api {
  return {
    async getNormalTemplates() {
      await sleep(TEMPLATE_DELAY_MS);
      const edits = readEdits();
      const types = new Set([
        ...(Object.keys(seed) as ReportType[]),
        ...(Object.keys(edits) as ReportType[]),
      ]);
      return [...types].map(
        (report_type): NormalTemplate => ({
          report_type,
          template_text: normalTemplateFor(report_type) ?? null,
        }),
      );
    },

    async saveNormalTemplate(report_type, template_text) {
      await sleep(TEMPLATE_DELAY_MS);
      try {
        localStorage.setItem(
          TEMPLATES_KEY,
          JSON.stringify({ ...readEdits(), [report_type]: template_text }),
        );
      } catch {
        throw new Error("Couldn't save in this browser");
      }
    },

    // Findings are ignored: output is canned, per Report Type and model.
    async generateReport(model, report_type) {
      await sleep(2000 + Math.random() * 2000);
      const template = normalTemplateFor(report_type);
      // Same as the real backend when no Normal Template exists (404).
      if (template === undefined) throw new Error("Normal Template not found");
      return seed[report_type]?.reports[model] ?? template;
    },
  };
}
