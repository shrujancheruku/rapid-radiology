import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { ALL_REPORT_TYPES, type ReportTemplate, ReportType } from "../types";
import Layout from "../components/Layout";
import Template from "../components/Template";
import { ApiClient } from "../clients/ApiClient";

interface TemplateState extends ReportTemplate {
    saving: boolean;
    error: string | null;
    success: boolean;
}

export default function TemplatesPage() {
    const { user, session } = useAuth();
    const { addNotification } = useNotifications();

    const [templates, setTemplates] = useState<TemplateState[]>([]);
    const [loading, setLoading] = useState(true);
    const [openTemplate, setOpenTemplate] = useState<ReportType | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const apiClient = new ApiClient(session);

    const fetchTemplates = async () => {
        if (!user) return;
        try {
            const data = await apiClient.getTemplates();
            setTemplates(
                data.map((t) => ({ ...t, saving: false, success: false, error: null }))
            );
        } catch (err: any) {
            addNotification("Error fetching templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const saveTemplate = async (report_type: ReportType, value: string) => {
        if (!user || !value) return;

        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === report_type ? { ...t, saving: true, error: null } : t
            )
        );

        try {
            await apiClient.saveTemplate(report_type, value);
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === report_type ? { ...t, saving: false, success: true } : t
                )
            );
            addNotification(`${report_type} saved`, "success");
        } catch (err: any) {
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === report_type ? { ...t, saving: false, error: err.message } : t
                )
            );
            addNotification(`Error saving ${report_type}: ${err.message}`, "error");
        }
    };

    const addTemplate = (report_type: ReportType) => {
        setShowDropdown(false);

        if (templates.find((t) => t.report_type === report_type)) return;

        const newTemplate: TemplateState = {
            report_type,
            template_text: "",
            saving: false,
            success: false,
            error: null,
        };

        setTemplates((prev) => [...prev, newTemplate]);
        setOpenTemplate(report_type);
    };

    const availableReportTypes = ALL_REPORT_TYPES.filter(
        (rt) => !templates.some((t) => t.report_type === rt)
    );

    useEffect(() => {
        fetchTemplates();
    }, [user]);

    if (loading) return <Layout>Loading...</Layout>;

    return (
        <Layout>
            <div className="space-y-6">
                {templates.map((template) => (
                    <Template
                        key={template.report_type}
                        id={`template-${template.report_type}`}
                        reportType={template.report_type}
                        templateText={template.template_text}
                        saving={template.saving}
                        success={template.success}
                        error={template.error}
                        handleChange={(rt, val) =>
                            setTemplates((prev) =>
                                prev.map((t) =>
                                    t.report_type === rt ? { ...t, template_text: val, success: false, error: null } : t
                                )
                            )
                        }
                        saveTemplate={saveTemplate}
                        isOpen={openTemplate === template.report_type}
                        onToggle={() =>
                            setOpenTemplate((prev) =>
                                prev === template.report_type ? null : template.report_type
                            )
                        }
                    />
                ))}

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-between w-56"
                    >
                        <span>Create New Template</span>
                        <span className="ml-2 transition-transform duration-300" style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
                    </button>

                    <div
                        className={`absolute left-0 mt-2 w-56 rounded transition-all duration-300 ease-in-out ${
                            showDropdown ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                        style={{ transitionProperty: "max-height, opacity" }}
                    >
                        {availableReportTypes.length > 0 ? (
                            availableReportTypes.map((rt) => (
                                <button
                                    key={rt}
                                    onClick={() => addTemplate(rt)}
                                    className="block w-full text-left px-4 py-2 mb-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {rt}
                                </button>
                            ))
                        ) : (
                            <p className="px-4 py-2 text-gray-500 dark:text-gray-400">All templates created</p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}