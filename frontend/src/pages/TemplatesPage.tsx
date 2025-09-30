import {useCallback, useEffect, useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {ApiClient} from "@/clients/apiClient";
import {type ReportTemplate, ReportType} from "@/types";
import Layout from "@/components/Layout";
import Template from "@/components/Template";
import LoadingPage from "@/pages/LoadingPage";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";
import {AnimatePresence, motion} from "framer-motion";

interface TemplateState extends ReportTemplate {
    saving: boolean;
    error: string | null;
    success: boolean;
}

export default function TemplatesPage() {
    const {user, session} = useAuth();

    const [templates, setTemplates] = useState<TemplateState[]>([]);
    const [loading, setLoading] = useState(true);
    const [openTemplate, setOpenTemplate] = useState<ReportType | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    // Animation state managed at page level
    const [showSuccessMap, setShowSuccessMap] = useState<Record<string, boolean>>({});

    const api = new ApiClient(session);

    // Fetch templates
    const fetchTemplates = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const res = await api.getTemplates();
            // Merge existing templates with fetched ones to prevent flicker
            setTemplates((prev) => {
                const prevMap = Object.fromEntries(prev.map(t => [t.report_type, t]));
                return res.map((t) => ({
                    saving: prevMap[t.report_type]?.saving || false,
                    error: prevMap[t.report_type]?.error || null,
                    success: prevMap[t.report_type]?.success || false,
                    template_text: prevMap[t.report_type]?.template_text ?? t.template_text,
                    report_type: t.report_type,
                }));
            });
            setHasFetched(true);
        } catch {
            toast.error("Error fetching templates");
        } finally {
            setLoading(false);
        }
    }, [user, api]);

    useEffect(() => {
        if (!hasFetched) fetchTemplates();
    }, [hasFetched, fetchTemplates]);

    // Handle text change locally
    const handleChange = (report_type: ReportType, value: string) => {
        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === report_type
                    ? {...t, template_text: value, success: false, error: null}
                    : t
            )
        );
    };

    // Save template
    const saveTemplate = async (report_type: ReportType, value: string) => {
        if (!user || !value) return;

        // Optimistic save state
        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === report_type ? {...t, saving: true, error: null} : t
            )
        );

        try {
            await api.saveTemplate(report_type, value);

            // Trigger tick animation
            setShowSuccessMap((prev) => ({...prev, [report_type]: true}));

            setTimeout(() => {
                setShowSuccessMap((prev) => ({...prev, [report_type]: false}));
            }, 2000);

            // Merge updated template instead of replacing all templates
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === report_type
                        ? {...t, saving: false, success: true, template_text: value}
                        : t
                )
            );
        } catch (err: any) {
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === report_type
                        ? {...t, saving: false, error: err.message}
                        : t
                )
            );
            toast.error(`Error saving ${report_type}: ${err.message}`);
        }
    };

    // Add new template
    const addTemplate = async (report_type: ReportType) => {
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

    const availableReportTypes = Object.values(ReportType).filter(
        (rt) => !templates.some((t) => t.report_type === rt)
    );

    if (loading && templates.length === 0)
        return <Layout><LoadingPage/></Layout>

    return (
        <Layout>
            <AnimatePresence>
                <motion.div
                    key="templates"
                    initial={{opacity: 0, y: 0}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 0}}
                    transition={{duration: 1}}
                >
                    <div className="space-y-6">
                        {templates.map((template) => (
                            <Template
                                key={template.report_type}
                                id={`template-${template.report_type}`}
                                reportType={template.report_type}
                                templateText={template.template_text}
                                saving={template.saving}
                                success={template.success}
                                showSuccess={showSuccessMap[template.report_type] || false}
                                error={template.error}
                                handleChange={handleChange}
                                saveTemplate={saveTemplate}
                                isOpen={openTemplate === template.report_type}
                                onToggle={() =>
                                    setOpenTemplate((prev) =>
                                        prev === template.report_type ? null : template.report_type
                                    )
                                }
                            />
                        ))}

                        {availableReportTypes.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-56">Create New Template</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    {availableReportTypes.map((rt) => (
                                        <DropdownMenuItem
                                            key={rt}
                                            onClick={() => addTemplate(rt)}
                                            className="cursor-pointer"
                                        >
                                            {rt}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </Layout>
    );
}