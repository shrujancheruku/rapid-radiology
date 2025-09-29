import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage";
import TemplatesPage from "./pages/TemplatesPage";

function AppWrapper() {
    const { user, loading } = useAuth();
    if (loading) return <p className="p-4 text-gray-600 dark:text-gray-300">Loading...</p>;
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/templates" element={user ? <TemplatesPage /> : <Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppWrapper />
            </NotificationProvider>
        </AuthProvider>
    );
}