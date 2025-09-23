import {ChangeEvent, useEffect, useState} from "react";
import axios from "axios";

import {useAuth} from "../contexts/AuthContext";
import {useNotifications} from "../contexts/NotificationContext";
import DarkModeToggle from "../components/DarkModeToggle";
import {ReportTemplate, ReportType} from "../types";

interface TemplateState extends ReportTemplate {
    saving: boolean;
    error: string | null;
    success: boolean;
    debounceTimer?: number;
}

export default function TemplatesPage() {
    const {user, logout} = useAuth();
    const {addNotification} = useNotifications();
    const [templates, setTemplates] = useState<TemplateState[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL as string;

    const fetchTemplates = async () => {
        if (!user) return;
        const token = await user.getIdToken();
        try {
            const res = await axios.get<ReportTemplate[]>(`${API_URL}/me/templates`, {
                headers: {Authorization: `Bearer ${token}`},
            });
            setTemplates(
                res.data.map((t) => ({...t, saving: false, error: null, success: false}))
            );
        } catch (err) {
            addNotification("Error fetching templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (report_type: ReportType, value: string) => {
        setTemplates((prev) =>
            prev.map((t) => {
                if (t.report_type === report_type) {
                    if (t.debounceTimer) clearTimeout(t.debounceTimer);
                    const timer = window.setTimeout(() => saveTemplate({...t, template_text: value}), 800);
                    return {...t, template_text: value, success: false, error: null, debounceTimer: timer};
                }
                return t;
            })
        );
    };

    const saveTemplate = async (template: TemplateState) => {
        if (!user) return;
        setTemplates((prev) =>
            prev.map((t) =>
                t.report_type === template.report_type ? {...t, saving: true, error: null} : t
            )
        );
        try {
            const token = await user.getIdToken();
            await axios.post(
                `${API_URL}/templates/`,
                {report_type: template.report_type, template_text: template.template_text},
                {headers: {Authorization: `Bearer ${token}`}}
            );
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === template.report_type
                        ? {...t, saving: false, success: true}
                        : t
                )
            );
            addNotification(`${template.report_type} saved`, "success");
        } catch (err: any) {
            setTemplates((prev) =>
                prev.map((t) =>
                    t.report_type === template.report_type
                        ? {...t, saving: false, error: err.message}
                        : t
                )
            );
            addNotification(`Error saving ${template.report_type}: ${err.message}`, "error");
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [user]);

    if (loading) return <p className="p-4 text-gray-600 dark:text-gray-300">Loading...</p>;

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Templates</h2>
                <div className="flex space-x-2">
                    <DarkModeToggle/>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {templates.map((t) => (
                <div key={t.report_type} className="mb-6 p-4 border rounded shadow-sm bg-white dark:bg-gray-800">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{t.report_type}</h3>
                    <textarea
                        value={t.template_text || ""}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                            handleChange(t.report_type, e.target.value)
                        }
                        rows={5}
                        className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <div className="mt-2 flex items-center space-x-2">
                        {t.saving && <span className="text-gray-500 dark:text-gray-300 font-medium">Saving...</span>}
                        {t.success && <span className="text-green-500 font-medium">Saved!</span>}
                        {t.error && <span className="text-red-500 font-medium">{t.error}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}