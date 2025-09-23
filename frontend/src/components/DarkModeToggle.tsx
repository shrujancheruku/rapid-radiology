import {useEffect, useState} from "react";

export default function DarkModeToggle() {
    const [darkMode, setDarkMode] = useState(
        document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    }, [darkMode]);

    return (
        <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded"
        >
            {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
    );
}