import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/clients/apiClient";
import { type ModelId, type NormalTemplate, ReportType } from "@/types";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FindingsStep from "@/components/home/FindingsStep";
import ReportsStep from "@/components/home/ReportsStep";
import ReportTypeStep from "@/components/home/ReportTypeStep";
import { MODELS } from "@/components/home/models";
import LoadingPage from "@/pages/LoadingPage";

type Step = 1 | 2 | 3;

const NO_REPORTS: Record<ModelId, string | null> = {
  openai: null,
  gemini: null,
};

export default function HomePage() {
  const [normalTemplates, setNormalTemplates] = useState<NormalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [findings, setFindings] = useState("");
  const [reports, setReports] = useState(NO_REPORTS);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const stepRefs = {
    1: useRef<HTMLDivElement | null>(null),
    2: useRef<HTMLDivElement | null>(null),
    3: useRef<HTMLDivElement | null>(null),
  };

  useEffect(() => {
    api
      .getNormalTemplates()
      .then(setNormalTemplates)
      .catch(() => toast.error("Couldn't load Normal Templates"))
      .finally(() => setLoading(false));
  }, []);

  const stepRef = stepRefs[step];
  useEffect(() => {
    let timer = 0;
    const raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        stepRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }, 50);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [stepRef]);

  const handleGenerate = async () => {
    if (!selectedType || !findings) return;
    setSubmitting(true);
    setReports(NO_REPORTS);
    setStep(3);

    await Promise.allSettled(
      MODELS.map(({ id, label }) =>
        api
          .generateReport(id, selectedType, findings)
          .then((report) => setReports((prev) => ({ ...prev, [id]: report })))
          .catch(() => toast.error(`Couldn't generate the ${label} Report`)),
      ),
    );
    setSubmitting(false);
  };

  const reset = () => {
    setStep(1);
    setSelectedType(null);
    setFindings("");
    setReports(NO_REPORTS);
  };

  if (loading) {
    return (
      <Layout>
        <LoadingPage />
      </Layout>
    );
  }

  if (normalTemplates.length === 0) {
    return (
      <Layout>
        <motion.div
          key="no-templates"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <Card className="max-w-lg mx-auto mt-10">
            <CardHeader>
              <CardTitle>No Normal Templates yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Create a Normal Template for a Report Type before generating
                Reports.
              </p>
              <Button onClick={() => navigate("/templates")}>
                Go to Normal Templates
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 mt-6">
        <AnimatePresence>
          <motion.div
            ref={stepRefs[1]}
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <ReportTypeStep
              normalTemplates={normalTemplates}
              selectedType={selectedType}
              onSelect={(reportType) => {
                setSelectedType(reportType);
                setStep(2);
              }}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && selectedType && (
            <motion.div
              ref={stepRefs[2]}
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FindingsStep
                findings={findings}
                onChange={setFindings}
                onGenerate={handleGenerate}
                submitting={submitting}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === 3 && (
            <motion.div
              ref={stepRefs[3]}
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ReportsStep
                reports={reports}
                submitting={submitting}
                onReset={reset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
