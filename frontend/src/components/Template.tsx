import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {ChevronDown, Loader2, Check, X} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
import {ReportType} from "@/types";

interface TemplateProps {
    id: string;
    reportType: ReportType;
    templateText: string | null;
    saving: boolean;
    success: boolean;
    showSuccess?: boolean; // page-level state
    error: string | null;
    handleChange: (reportType: ReportType, value: string) => void;
    saveTemplate: (reportType: ReportType, value: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function Template({
                                     id,
                                     reportType,
                                     templateText,
                                     saving,
                                     success,
                                     showSuccess = false,
                                     error,
                                     handleChange,
                                     saveTemplate,
                                     isOpen,
                                     onToggle,
                                 }: TemplateProps) {
    const [localText, setLocalText] = useState(templateText || "");

    useEffect(() => {
        setLocalText(templateText || "");
    }, [templateText]);

    return (
        <Card key={id} className="py-4">
            <CardHeader
                className="flex flex-row justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <CardTitle className="text-lg font-medium">{reportType}</CardTitle>
                <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </CardHeader>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{height: 0, opacity: 0}}
                        animate={{height: "auto", opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.3, ease: "easeInOut"}}
                    >
                        <CardContent className="space-y-4">
                            <Textarea
                                value={localText}
                                onChange={(e) => {
                                    setLocalText(e.target.value);
                                    handleChange(reportType, e.target.value);
                                }}
                                placeholder="Enter template text..."
                                className="min-h-[200px]"
                            />

                            <div className="flex items-center space-x-2 relative">
                                {/* Save button */}
                                <Button
                                    variant="secondary"
                                    onClick={() => saveTemplate(reportType, localText)}
                                    disabled={saving}
                                >
                                    Save
                                </Button>

                                {/* Loader / Tick / Error container */}
                                <div className="relative w-7 h-7">
                                    <AnimatePresence>
                                        {/* Loader */}
                                        {saving && (
                                            <motion.div
                                                key="loader"
                                                initial={{opacity: 0, scale: 0.5}}
                                                animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0, scale: 0.5}}
                                                transition={{duration: 0.2}}
                                                className="absolute top-0 left-0"
                                            >
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </motion.div>
                                        )}

                                        {/* Tick inside a circle */}
                                        {showSuccess && !saving && (
                                            <motion.div
                                                key="success"
                                                initial={{opacity: 0, scale: 0.3}}
                                                animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0, scale: 0.3}}
                                                transition={{duration: 0.3}}
                                                className="absolute top-0 left-0 flex items-center justify-center w-6 h-6 rounded-full bg-accent"
                                            >
                                                <Check className="h-4 w-4 text-primary" />
                                            </motion.div>
                                        )}

                                        {/* Error cross inside a circle */}
                                        {error && !saving && (
                                            <motion.div
                                                key="error"
                                                initial={{opacity: 0, scale: 0.3}}
                                                animate={{opacity: 1, scale: 1}}
                                                exit={{opacity: 0, scale: 0.3}}
                                                transition={{duration: 0.3}}
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
                )}
            </AnimatePresence>
        </Card>
    );
}