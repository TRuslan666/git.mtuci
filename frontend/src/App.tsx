import { lazy, Suspense, useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthRequired from "./components/AuthRequired";
import AdminRequired from "./components/AdminRequired";
import NavBar from "./components/NavBar";
import AdminHeader from "./components/AdminHeader";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { PendingCountProvider } from "./context/PendingCountContext";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const AssignmentPage = lazy(() => import("./pages/AssignmentPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RepositoriesPage = lazy(() => import("./pages/RepositoriesPage"));
const ForksPage = lazy(() => import("./pages/ForksPage"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const AdminSettingsPage = lazy(() => import("./pages/AdminSettingsPage"));

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const ADMIN_PATHS = ["/admin", "/users", "/roles", "/admin/forks", "/admin/activity", "/admin/monitoring", "/admin/settings", "/repositories"];

export default function App() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);
  const isAdminPage = ADMIN_PATHS.some(path => location.pathname.startsWith(path));

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(prev => !prev);

  // Theme colors
  const bgColor = isDarkTheme ? "bg-[#111111]" : "bg-gray-50";
  const mainBgColor = isDarkTheme ? "bg-[#111111]" : "bg-white";

  return (
    <PendingCountProvider>
    <div className={`h-screen flex flex-col ${bgColor}`}>
      {!isAuthPage && (isAdminPage ? <AdminHeader isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} /> : <NavBar isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} />)}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {!isAuthPage ? <Sidebar isDarkTheme={isDarkTheme} /> : null}
        <div className="flex flex-1 flex-col min-h-0">
          <main className={`flex-1 overflow-y-auto py-6 px-4 ${mainBgColor}`}>
            <Suspense fallback={<div className={`mx-auto max-w-7xl px-4 text-sm ${isDarkTheme ? "text-gray-600" : "text-gray-400"}`}>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage isDarkTheme={isDarkTheme} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<AuthRequired />}>
                  <Route path="/profile" element={<ProfilePage isDarkTheme={isDarkTheme} />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:courseId" element={<CoursePage />} />
                  <Route
                    path="/courses/:courseId/assignments/:assignmentId"
                    element={<AssignmentPage />}
                  />
                  {/* Placeholder routes for new sidebar items */}
                  <Route path="/dashboard" element={<DashboardPage isDarkTheme={isDarkTheme} />} />
                  <Route path="/projects" element={<CoursesPage />} />
                  <Route path="/repositories" element={<RepositoriesPage isDarkTheme={isDarkTheme} />} />
                  <Route path="/assignments" element={<CoursesPage />} />
                  <Route path="/grades" element={<ProfilePage isDarkTheme={isDarkTheme} />} />
                  <Route path="/submissions" element={<CoursesPage />} />
                  <Route path="/students" element={<CoursesPage />} />
                  <Route path="/logs" element={<LogsPage isDarkTheme={isDarkTheme} />} />
                  <Route path="/settings" element={<ProfilePage isDarkTheme={isDarkTheme} />} />
                  <Route element={<AdminRequired />}>
                    <Route path="/admin" element={<AdminPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/users" element={<UsersPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/roles" element={<RolesPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/admin/forks" element={<ForksPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/admin/activity" element={<ActivityPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/admin/monitoring" element={<MonitoringPage isDarkTheme={isDarkTheme} />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage isDarkTheme={isDarkTheme} />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </main>
          {!isAuthPage ? <Footer isDarkTheme={isDarkTheme} /> : null}
        </div>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkTheme ? "#1e1e1e" : "#ffffff",
            color: isDarkTheme ? "#ffffff" : "#1f2937",
            border: isDarkTheme ? "1px solid #2d2d2d" : "1px solid #e5e7eb",
            padding: "12px 16px",
            borderRadius: "8px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#1e1e1e",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#1e1e1e",
            },
          },
        }}
      />
    </div>
    </PendingCountProvider>
  );
}
