import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { ReportTemplate, ReportType, ALL_REPORT_TYPES } from "../types";
import Layout from "../components/Layout";
import LoadingPage from "./LoadingPage";
import { ApiClient } from "../clients/ApiClient";

export default function HomePage() {
    const { user, session } = useAuth();
    const { addNotification } = useNotifications();
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [step1Selection, setStep1Selection] = useState<ReportType | null>(null);
    const [radiologistInput, setRadiologistInput] = useState("");
    const [step2Loading, setStep2Loading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const api = new ApiClient(session);

    // Fetch user templates
    useEffect(() => {
        if (!user) return;
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const data = await api.getTemplates();
                setTemplates(data);
            } catch (err: any) {
                addNotification("Error fetching templates", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [user]);

    const handleSubmit = async () => {
        if (!step1Selection || !radiologistInput) return;
        setStep2Loading(true);

        try {
            const generatedReport = await api.generateReport(step1Selection, radiologistInput);
            setResult(generatedReport);
        } catch (err: any) {
            addNotification("Error generating report: " + err.message, "error");
        } finally {
            setStep2Loading(false);
        }
    };

    const handleRestart = () => {
        setStep1Selection(null);
        setRadiologistInput("");
        setResult(null);
    };

    if (loading) return <LoadingPage loading={loading} />;

    if (templates.length === 0) {
        return (
            <Layout>
                <div className="p-6 text-center">
                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                        You don’t have any templates yet.
                    </p>
                    <a
                        href="/templates"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Go to Templates
                    </a>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 max-w-3xl mx-auto">
                {/* Step 1: Select template */}
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Step 1: Select Template</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {templates.map((t) => (
                            <button
                                key={t.report_type}
                                onClick={() => setStep1Selection(t.report_type)}
                                className={`px-4 py-2 rounded border transition ${
                                    step1Selection === t.report_type
                                        ? "bg-blue-500 text-white border-blue-500"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                                }`}
                            >
                                {t.report_type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 2: Radiologist Input */}
                {step1Selection && (
                    <div className="space-y-2 transition-all duration-500 ease-in-out">
                        <hr className="border-gray-300 dark:border-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Step 2: Radiologist Input</h2>
                        <textarea
                            value={radiologistInput}
                            onChange={(e) => setRadiologistInput(e.target.value)}
                            rows={5}
                            className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={step2Loading}
                            className={`px-4 py-2 rounded text-white transition ${
                                step2Loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
                            }`}
                        >
                            {step2Loading ? "Generating..." : "Submit"}
                        </button>
                    </div>
                )}

                {/* Step 3: Result */}
                {result && (
                    <div className="space-y-2 transition-all duration-500 ease-in-out">
                        <hr className="border-gray-300 dark:border-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Step 3: Result</h2>
                        <textarea
                            value={result}
                            readOnly
                            rows={10}
                            className="w-full p-2 border rounded resize-none focus:outline-none bg-gray-100 dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={() => result && navigator.clipboard.writeText(result)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Copy to Clipboard
                            </button>
                            <button
                                onClick={handleRestart}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                            >
                                Restart
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}