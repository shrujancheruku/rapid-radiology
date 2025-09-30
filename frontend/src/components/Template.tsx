import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {ChevronDown, Loader2} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
import {ReportType} from "@/types";

interface TemplateProps {
    id: string;
    reportType: ReportType;
    templateText: string | null;
    saving: boolean;
    success: boolean;
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
                                     error,
                                     handleChange,
                                     saveTemplate,
                                     isOpen,
                                     onToggle,
                                 }: TemplateProps) {
    const [localText, setLocalText] = useState(templateText || "");

    return (
        <Card key={id} className="py-4">
            <CardHeader
                className="flex flex-row justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <CardTitle className="text-lg font-medium">{reportType}</CardTitle>
                <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </CardHeader>

            {/* AnimatePresence ensures smooth exit */}
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
                            <div className="flex space-x-2 items-center">
                                <Button
                                    variant='secondary'
                                    onClick={() => saveTemplate(reportType, localText)}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Saving...
                                        </>
                                    ) : (
                                        "Save"
                                    )}
                                </Button>
                                {success && (
                                    <span className="text-green-600 text-sm">Saved!</span>
                                )}
                                {error && <span className="text-red-600 text-sm">{error}</span>}
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}