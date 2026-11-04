import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/useAuth";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import TemplatesPage from "@/pages/TemplatesPage";
import LoadingPage from "@/pages/LoadingPage.tsx";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "sonner";

function AppWrapper() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/templates"
          element={user ? <TemplatesPage /> : <Navigate to="/login" />}
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper />
        <Toaster richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
