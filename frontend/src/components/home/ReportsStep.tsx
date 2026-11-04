import { Button } from "@/components/ui/button";
import ReportCard from "@/components/home/ReportCard";
import { MODELS } from "@/components/home/models";
import type { ModelId } from "@/types";

interface ReportsStepProps {
  reports: Record<ModelId, string | null>;
  submitting: boolean;
  onReset: () => void;
}

export default function ReportsStep({
  reports,
  submitting,
  onReset,
}: ReportsStepProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODELS.map((model) => (
          <ReportCard
            key={model.id}
            label={model.label}
            icon={model.icon}
            report={reports[model.id]}
            submitting={submitting}
          />
        ))}
      </div>

      <div className="w-full flex justify-center items-center mt-4">
        <Button onClick={onReset}>Start Over</Button>
      </div>
    </>
  );
}
