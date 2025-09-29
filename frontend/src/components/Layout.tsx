import {ReactNode} from "react";
import {useAuth} from "../contexts/AuthContext";
import DarkModeToggle from "./DarkModeToggle";
import {NavLink} from "react-router-dom";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({children}: LayoutProps) {
    const {logout} = useAuth();

    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? "bg-blue-500 text-white dark:bg-blue-600"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`;

    return (
        <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
            {/* Header */}
            <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">Rapid Radiology</h1>
                    <nav className="mt-4 flex space-x-4">
                        <NavLink to="/" end className={linkClasses}>
                            Home
                        </NavLink>
                        <NavLink to="/templates" className={linkClasses}>
                            Templates
                        </NavLink>
                    </nav>
                    <div className="flex items-center space-x-3">
                        <DarkModeToggle />
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Navbar */}

            </header>

            {/* Page content */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}