import {useCallback, useEffect, useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {ApiClient} from "@/clients/apiClient";
import {type ReportTemplate, ReportType} from "@/types";
import Layout from "@/components/Layout";
import Template from "@/components/Template";
import LoadingPage from "@/pages/LoadingPage";

import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

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

    const api = new ApiClient(session);

    // Function to fetch templates
    const fetchTemplates = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const res = await api.getTemplates();
            setTemplates(
                res.map((t) => ({...t, saving: false, error: null, success: false}))
            );
            setHasFetched(true);
        } catch {
            toast.error("Error fetching templates");
        } finally {
            setLoading(false);
        }
    }, [user, api]);

    // Initial fetch (once per session)
    useEffect(() => {
        if (!hasFetched) {
            fetchTemplates();
        }
    }, [hasFetched, fetchTemplates]);

    // Handle template text change locally
    const handleChange = (report_type: ReportType, value: string) => {
        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === report_type
                    ? {...t, template_text: value, success: false, error: null}
                    : t
            )
        );
    };

    // Save template and refetch
    const saveTemplate = async (report_type: ReportType, value: string) => {
        if (!user || !value) return;

        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === report_type ? {...t, saving: true, error: null} : t
            )
        );

        try {
            await api.saveTemplate(report_type, value);
            toast.success(`${report_type} saved`);
            await fetchTemplates(); // refetch after save
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

    // Add new template and refetch
    const addTemplate = async (report_type: ReportType) => {
        if (templates.find((t) => t.report_type === report_type)) return;

        try {
            const newTemplate: TemplateState = {
                report_type,
                template_text: "",
                saving: false,
                success: false,
                error: null,
            };
            setTemplates((prev) => [...prev, newTemplate]);
            setOpenTemplate(report_type); // auto-open the new one
        } catch (err: any) {
            toast.error(`Error adding ${report_type}: ${err.message}`);
        }
    };

    const availableReportTypes = Object.values(ReportType).filter(
        (rt) => !templates.some((t) => t.report_type === rt)
    );

    return (
        <Layout>
            {loading && <LoadingPage/>}
            {!loading && (
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

                    {/* Add new template dropdown */}
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
            )}
        </Layout>
    );
}