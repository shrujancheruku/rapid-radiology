import { Clipboard, Loader2, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ReportCardProps {
  label: string;
  icon: LucideIcon;
  report: string | null;
  submitting: boolean;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6 },
};

export default function ReportCard({
  label,
  icon: Icon,
  report,
  submitting,
}: ReportCardProps) {
  const copy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    toast.success(`Copied ${label} Report to clipboard!`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <CardTitle>{label} Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="wait">
          {report ? (
            <motion.div key="report" {...fade}>
              <Textarea value={report} readOnly className="h-64" />
            </motion.div>
          ) : (
            <motion.div
              key={submitting ? "loading" : "failed"}
              {...fade}
              className="h-64 flex items-center justify-center text-muted-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                  Generating {label} Report...
                </>
              ) : (
                `No ${label} Report`
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="secondary"
          disabled={!report}
          onClick={copy}
          className="flex items-center justify-start"
        >
          <Clipboard className="h-4 w-4" />
          <span>Copy</span>
        </Button>
      </CardContent>
    </Card>
  );
}
