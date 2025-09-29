import { useEffect, useState } from "react";

interface LoadingPageProps {
    loading: boolean;
}

export default function LoadingPage({ loading }: LoadingPageProps) {
    const [visible, setVisible] = useState(false); // mount loader
    const [fade, setFade] = useState(false); // opacity

    useEffect(() => {
        let fadeTimer: number;
        let showTimer: number;

        if (loading) {
            // show loader after 0.5s
            showTimer = window.setTimeout(() => {
                setVisible(true);
                setFade(true); // fade-in
            }, 500);
        } else if (visible) {
            // fade out if already visible
            setFade(false);
            fadeTimer = window.setTimeout(() => setVisible(false), 500); // match transition duration
        }

        return () => {
            clearTimeout(showTimer);
            clearTimeout(fadeTimer);
        };
    }, [loading, visible]);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${
                fade ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="flex flex-col items-center p-4">
                {/* Bouncing dots */}
                <div className="flex space-x-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-0"></span>
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300"></span>
                </div>
                <p className="mt-4 text-white dark:text-gray-100 text-lg font-medium">
                    Loading...
                </p>
            </div>
        </div>
    );
}