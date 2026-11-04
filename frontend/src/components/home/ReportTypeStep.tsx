import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NormalTemplate, ReportType } from "@/types";

interface ReportTypeStepProps {
  normalTemplates: NormalTemplate[];
  selectedType: ReportType | null;
  onSelect: (reportType: ReportType) => void;
}

export default function ReportTypeStep({
  normalTemplates,
  selectedType,
  onSelect,
}: ReportTypeStepProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <CardTitle>Select a Report Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {normalTemplates.map((t) => (
            <Button
              key={t.report_type}
              variant={selectedType === t.report_type ? "default" : "outline"}
              onClick={() => onSelect(t.report_type)}
            >
              {t.report_type}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
