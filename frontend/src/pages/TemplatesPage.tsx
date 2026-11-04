import { useEffect, useState } from "react";
import { api } from "@/backend";
import { ReportType } from "@/types";
import Layout from "@/components/Layout";
import NormalTemplateEditor, {
  type SaveStatus,
} from "@/components/NormalTemplateEditor";
import LoadingPage from "@/pages/LoadingPage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface EditorState {
  report_type: ReportType;
  template_text: string;
  status: SaveStatus;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EditorState[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTemplate, setOpenTemplate] = useState<ReportType | null>(null);

  useEffect(() => {
    api
      .getNormalTemplates()
      .then((res) =>
        setTemplates(
          res.map((t) => ({
            report_type: t.report_type,
            template_text: t.template_text ?? "",
            status: "idle",
          })),
        ),
      )
      .catch(() => toast.error("Couldn't load Normal Templates"))
      .finally(() => setLoading(false));
  }, []);

  const update = (report_type: ReportType, changes: Partial<EditorState>) =>
    setTemplates((prev) =>
      prev.map((t) =>
        t.report_type === report_type ? { ...t, ...changes } : t,
      ),
    );

  const save = async ({ report_type, template_text }: EditorState) => {
    if (!template_text) return;
    update(report_type, { status: "saving" });

    try {
      await api.saveNormalTemplate(report_type, template_text);
      update(report_type, { status: "saved" });
      setTimeout(() => update(report_type, { status: "idle" }), 2000);
    } catch {
      update(report_type, { status: "error" });
      toast.error(`Couldn't save the ${report_type} Normal Template`);
    }
  };

  const addTemplate = (report_type: ReportType) => {
    setTemplates((prev) => [
      ...prev,
      { report_type, template_text: "", status: "idle" },
    ]);
    setOpenTemplate(report_type);
  };

  const availableReportTypes = Object.values(ReportType).filter(
    (rt) => !templates.some((t) => t.report_type === rt),
  );

  if (loading)
    return (
      <Layout>
        <LoadingPage />
      </Layout>
    );

  return (
    <Layout>
      <AnimatePresence>
        <motion.div
          key="templates"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="space-y-6">
            {templates.map((template) => (
              <NormalTemplateEditor
                key={template.report_type}
                reportType={template.report_type}
                templateText={template.template_text}
                status={template.status}
                onChange={(value) =>
                  update(template.report_type, {
                    template_text: value,
                    status: "idle",
                  })
                }
                onSave={() => save(template)}
                isOpen={openTemplate === template.report_type}
                onToggle={() =>
                  setOpenTemplate((prev) =>
                    prev === template.report_type ? null : template.report_type,
                  )
                }
              />
            ))}

            {availableReportTypes.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-56">New Normal Template</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {availableReportTypes.map((rt) => (
                    <DropdownMenuItem
                      key={rt}
                      onClick={() => addTemplate(rt)}
                      className="cursor-pointer"
                    >
                      {rt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
