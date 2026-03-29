import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../api/client";

export default function AuthRequired() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

