// src/pages/HomePage.tsx
import {useEffect, useState} from "react";
import {ApiClient} from "@/clients/apiClient";
import {useAuth} from "@/contexts/AuthContext";
import {ReportType} from "@/types";
import Layout from "@/components/Layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";
import {Clipboard, Loader2} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
import {useNavigate} from "react-router-dom";
import LoadingPage from "@/pages/LoadingPage.tsx";
import {toast} from "sonner";

interface ReportTemplate {
    report_type: ReportType;
    template_text: string | null;
}

export default function HomePage() {
    const {session} = useAuth();
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ReportType | null>(null);
    const [input, setInput] = useState("");
    const [report, setReport] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const api = new ApiClient(session);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.getTemplates();
                setTemplates(res);
            } catch {
                toast.error("Error loading templates");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleGenerate = async () => {
        if (!selectedType) return;
        setSubmitting(true);
        try {
            const result = await api.generateReport(selectedType, input);
            setReport(result);
            setStep(3);
        } catch {
            toast.error("Failed to generate report");
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSelectedType(null);
        setInput("");
        setReport(null);
    };

    if (loading) {
        return (
            <Layout>
                <LoadingPage/>
            </Layout>
        );
    }

    if (templates.length === 0) {
        return (
            <Layout>
                <Card className="max-w-lg mx-auto mt-10">
                    <CardHeader>
                        <CardTitle>No Templates Found</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            You don’t have any templates yet. Please create some before generating reports.
                        </p>
                        <Button onClick={() => navigate("/templates")}>Go to Templates</Button>
                    </CardContent>
                </Card>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6 mt-6">
                {/* Step 1 */}
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            key="step1"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 1: Select a Report Type</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        {templates.map((t) => (
                                            <Button
                                                key={t.report_type}
                                                variant={selectedType === t.report_type ? "default" : "outline"}
                                                onClick={() => {
                                                    setSelectedType(t.report_type);
                                                    setStep(2);
                                                }}
                                            >
                                                {t.report_type}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {step > 1 && <Separator/>}

                {/* Step 2 */}
                <AnimatePresence>
                    {step >= 2 && selectedType && (
                        <motion.div
                            key="step2"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 2: Enter Findings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Enter radiologist findings..."
                                    />
                                    <Button onClick={handleGenerate} disabled={submitting || !input}>
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Report"
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {step > 2 && <Separator/>}

                {/* Step 3 */}
                <AnimatePresence>
                    {step === 3 && report && (
                        <motion.div
                            key="step3"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Step 3: Generated Report</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Textarea value={report} readOnly className="h-64"/>
                                    <div className="flex gap-2">

                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                navigator.clipboard.writeText(report);
                                                toast.success("Copied report to clipboard!");
                                            }}
                                            className="flex items-center justify-start"
                                        >
                                            <Clipboard className="h-4 w-4"/>
                                            Copy
                                        </Button>
                                        <Button onClick={reset}>
                                            Start Over
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}