import type {ReportType} from "../types.ts";

interface TemplateProps {
    id?: string;
    reportType: ReportType;
    templateText: string | null;
    saving: boolean;
    success: boolean;
    error: string | null;
    handleChange: (reportType: ReportType, value: string) => void;
    saveTemplate: (reportType: ReportType, value: string) => void;
    isOpen: boolean; // controlled prop
    onToggle: () => void; // called when header is clicked
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
                                     onToggle
                                 }: TemplateProps) {

    return (
        <div id={id} className="mb-4 rounded shadow-sm bg-gray-300 dark:bg-gray-800">
            <div
                className="cursor-pointer p-4 flex justify-between items-center"
                onClick={onToggle} // delegate toggle to parent
            >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{reportType}</h3>
                <span
                    className="text-gray-600 dark:text-gray-300 transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    ▼
                </span>
            </div>

            <div
                style={{
                    maxHeight: isOpen ? 500 : 0,
                    transition: "max-height 0.3s ease",
                    overflow: "hidden",
                }}
            >
                {isOpen && (
                    <div className="px-4 py-2">
                        <textarea
                            value={templateText || ""}
                            onChange={(e) => handleChange(reportType, e.target.value)}
                            rows={5}
                            className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <div className="mt-2 flex items-center space-x-2">
                            <button
                                onClick={() => saveTemplate(reportType, templateText || "")}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save
                            </button>
                            {saving && <span className="text-gray-500 dark:text-gray-300 font-medium">Saving...</span>}
                            {success && <span className="text-green-600 dark:text-green-500 font-medium">Saved!</span>}
                            {error && <span className="text-red-500 font-medium">{error}</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}