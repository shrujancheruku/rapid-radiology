import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ReportType } from "@/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface NormalTemplateEditorProps {
    reportType: ReportType;
    templateText: string;
    status: SaveStatus;
    onChange: (value: string) => void;
    onSave: () => void;
    isOpen: boolean;
    onToggle: () => void;
}

const pop = {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.3 },
    transition: { duration: 0.3 },
};

export default function NormalTemplateEditor({
    reportType,
    templateText,
    status,
    onChange,
    onSave,
    isOpen,
    onToggle,
}: NormalTemplateEditorProps) {
    return (
        <Card className="pt-5 pb-0">
            <CardHeader
                className="flex flex-row justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <CardTitle className="text-lg font-medium">{reportType}</CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CardHeader>

            {/* Drawer with peek */}
            <AnimatePresence initial={false}>
                <motion.div
                    key="drawer"
                    initial={{ height: 0, opacity: 0.7 }}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0.7 }}
                    exit={{ height: 0, opacity: 0.7 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <CardContent className="space-y-4 overflow-hidden">
                        <Textarea
                            value={templateText}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Enter Normal Template text…"
                            className="min-h-[200px]"
                        />

                        <div className="flex items-center space-x-2 relative mb-4">
                            <Button variant="secondary" onClick={onSave} disabled={status === "saving"}>
                                Save
                            </Button>

                            <div className="relative w-7 h-7">
                                <AnimatePresence>
                                    {status === "saving" && (
                                        <motion.div
                                            key="loader"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-0 left-0"
                                        >
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </motion.div>
                                    )}

                                    {status === "saved" && (
                                        <motion.div
                                            key="success"
                                            {...pop}
                                            className="absolute top-0 left-0 flex items-center justify-center w-6 h-6 rounded-full bg-accent"
                                        >
                                            <Check className="h-4 w-4 text-primary" />
                                        </motion.div>
                                    )}

                                    {status === "error" && (
                                        <motion.div
                                            key="error"
                                            {...pop}
                                            className="absolute top-0 left-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100"
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </motion.div>
            </AnimatePresence>
        </Card>
    );
}
