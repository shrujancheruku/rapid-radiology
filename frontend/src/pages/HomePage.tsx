// src/pages/HomePage.tsx
import {type RefObject, useEffect, useRef, useState} from "react";
import {ApiClient} from "@/clients/apiClient";
import {useAuth} from "@/contexts/AuthContext";
import {ReportType} from "@/types";
import Layout from "@/components/Layout";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Textarea} from "@/components/ui/textarea";
import {BotMessageSquare, Clipboard, Edit, FileText, Loader2, Sparkle} from "lucide-react";
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
    const [geminiReport, setGeminiReport] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const api = new ApiClient(session);

    // Refs for steps
    const step1Ref = useRef<HTMLDivElement | null>(null);
    const step2Ref = useRef<HTMLDivElement | null>(null);
    const step3Ref = useRef<HTMLDivElement | null>(null);

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

    // SCROLL INTO VIEW: wait a frame + short timeout so AnimatePresence/framer-motion can mount the DOM node
    useEffect(() => {
        const map: {
            1: RefObject<HTMLDivElement | null>;
            2: RefObject<HTMLDivElement | null>;
            3: RefObject<HTMLDivElement | null>
        } = {
            1: step1Ref,
            2: step2Ref,
            3: step3Ref,
        };

        let raf = 0;
        let timer = 0;

        const scrollTo = () => {
            const target = map[step as 1 | 2 | 3]?.current;
            if (target && typeof target.scrollIntoView === "function") {
                try {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "end",
                        inline: "nearest",
                    });
                } catch {
                    // fallback to instant if some browsers choke
                    target.scrollIntoView(true);
                }
            }
        };

        raf = requestAnimationFrame(() => {
            // small delay to allow framer-motion to mount
            timer = window.setTimeout(scrollTo, 50);
        });

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [step]);

    const handleGenerate = async () => {
        if (!selectedType) return;
        setSubmitting(true);
        setReport(null)
        setGeminiReport(null)
        setStep(3);

        api.generateReport(selectedType, input)
            .then((res) => setReport(res))
            .catch(() => toast.error("Failed to generate report"));

        api.generateGeminiReport(selectedType, input)
            .then((res) => setGeminiReport(res))
            .catch(() => toast.error("Failed to generate Gemini report"))
            .finally(() => setSubmitting(false));
    };

    const reset = () => {
        setStep(1);
        setSelectedType(null);
        setInput("");
        setReport(null);
        setGeminiReport(null);
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
                <motion.div
                    key="no-templates"
                    initial={{opacity: 0, y: 0}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 0}}
                    transition={{duration: 1}}
                >
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
                </motion.div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6 mt-6">
                {/* Step 1 */}
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            ref={step1Ref}
                            key="step1"
                            initial={{opacity: 0, y: 0}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: 0}}
                            transition={{duration: 1}}
                        >
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    <CardTitle>Select a Report Type</CardTitle>
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

                {/* Step 2 */}
                <AnimatePresence>
                    {step >= 2 && selectedType && (
                        <motion.div
                            ref={step2Ref}
                            key="step2"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <Edit className="h-5 w-5 text-primary"/>
                                    <CardTitle>Enter Findings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Enter radiologist findings..."
                                    />
                                    <Button onClick={handleGenerate} disabled={submitting || !input}>
                                        <span>Generate Reports</span>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step 3 */}
                <AnimatePresence>
                    {step === 3 && (
                        <motion.div
                            ref={step3Ref}
                            key="step3"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{duration: 0.4}}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* OpenAI report */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-2">
                                        <BotMessageSquare className="h-5 w-5 text-primary"/>
                                        <CardTitle>OpenAI Report</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <AnimatePresence mode="wait">
                                            {report ? (
                                                <motion.div
                                                    key="report"
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    exit={{opacity: 0}}
                                                    transition={{duration: 0.6}}
                                                >
                                                    <Textarea value={report} readOnly className="h-64"/>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="report-loading"
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    exit={{opacity: 0}}
                                                    transition={{duration: 0.6}}
                                                    className="h-64 flex items-center justify-center text-muted-foreground"
                                                >
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary"/>
                                                    Generating OpenAI report...
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <Button
                                            variant="secondary"
                                            disabled={!report}
                                            onClick={() => {
                                                if (report) {
                                                    navigator.clipboard.writeText(report);
                                                    toast.success("Copied OpenAI report to clipboard!");
                                                }
                                            }}
                                            className="flex items-center justify-start"
                                        >
                                            <Clipboard className="h-4 w-4"/>
                                            <span>Copy</span>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Gemini report */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-2">
                                        <Sparkle className="h-5 w-5 text-primary"/>
                                        <CardTitle>Gemini Report</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <AnimatePresence mode="wait">
                                            {geminiReport ? (
                                                <motion.div
                                                    key="gemini-report"
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    exit={{opacity: 0}}
                                                    transition={{duration: 0.6}}
                                                >
                                                    <Textarea value={geminiReport} readOnly className="h-64"/>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="gemini-loading"
                                                    initial={{opacity: 0}}
                                                    animate={{opacity: 1}}
                                                    exit={{opacity: 0}}
                                                    transition={{duration: 0.6}}
                                                    className="h-64 flex items-center justify-center text-muted-foreground"
                                                >
                                                    <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary"/>
                                                    Generating Gemini report...
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <Button
                                            disabled={!geminiReport}
                                            variant="secondary"
                                            onClick={() => {
                                                if (geminiReport) {
                                                    navigator.clipboard.writeText(geminiReport);
                                                    toast.success("Copied Gemini report to clipboard!");
                                                }
                                            }}
                                            className="flex items-center justify-start"
                                        >
                                            <Clipboard className="h-4 w-4"/>
                                            <span>Copy</span>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="w-full flex justify-center items-center mt-4">
                                <Button onClick={reset}>Start Over</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    )
        ;
}