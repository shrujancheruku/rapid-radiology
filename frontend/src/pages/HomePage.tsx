// src/pages/HomePage.tsx
import {useEffect, useState} from "react";
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
        setStep(3);

        // Run both requests in parallel
        api
            .generateReport(selectedType, input)
            .then((res) => setReport(res))
            .catch(() => toast.error("Failed to generate report"));

        api
            .generateGeminiReport(selectedType, input)
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
                                        Generate Reports
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
                            key="step3"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* OpenAI Report Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-2">
                                        <BotMessageSquare className="h-5 w-5 text-primary"/>
                                        <CardTitle>OpenAI Report</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {report ? (
                                            <>
                                                <Textarea value={report} readOnly className="h-64"/>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(report);
                                                            toast.success("Copied OpenAI report to clipboard!");
                                                        }}
                                                        className="flex items-center justify-start"
                                                    >
                                                        <Clipboard className="h-4 w-4 mr-2"/>
                                                        Copy
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                className="h-64 flex items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                                                Generating OpenAI report...
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Gemini Report Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-2">
                                        <Sparkle className="h-5 w-5 text-primary"/>
                                        <CardTitle>Gemini Report</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {geminiReport ? (
                                            <>
                                                <Textarea value={geminiReport} readOnly className="h-64"/>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(geminiReport);
                                                            toast.success("Copied Gemini report to clipboard!");
                                                        }}
                                                        className="flex items-center justify-start"
                                                    >
                                                        <Clipboard className="h-4 w-4 mr-2"/>
                                                        Copy
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                className="h-64 flex items-center justify-center text-muted-foreground">
                                                <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                                                Generating Gemini report...
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className='w-full flex justify-center items-center mt-4'>
                                <Button onClick={reset}>Start Over</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}