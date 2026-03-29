import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AuthRequired from "./components/AuthRequired";
import AdminRequired from "./components/AdminRequired";
import NavBar from "./components/NavBar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
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
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RepositoriesPage = lazy(() => import("./pages/RepositoriesPage"));

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function App() {
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <div className="h-screen overflow-hidden bg-[#f5f3fa]">
      {!isAuthPage ? <NavBar /> : null}
      <div className="flex h-[calc(100vh-56px)]">
        {!isAuthPage ? <Sidebar /> : null}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden py-6 px-4">
            <Suspense fallback={<div className="mx-auto max-w-7xl px-4 text-sm text-gray-600">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<AuthRequired />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/:courseId" element={<CoursePage />} />
                  <Route
                    path="/courses/:courseId/assignments/:assignmentId"
                    element={<AssignmentPage />}
                  />
                  {/* Placeholder routes for new sidebar items */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<CoursesPage />} />
                  <Route path="/repositories" element={<RepositoriesPage />} />
                  <Route path="/assignments" element={<CoursesPage />} />
                  <Route path="/grades" element={<ProfilePage />} />
                  <Route path="/submissions" element={<CoursesPage />} />
                  <Route path="/students" element={<CoursesPage />} />
                  <Route path="/logs" element={<AdminPage />} />
                  <Route path="/settings" element={<ProfilePage />} />
                  <Route element={<AdminRequired />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Suspense>
          </main>
          {!isAuthPage ? <Footer /> : null}
        </div>
      </div>
    </div>
  );
}
