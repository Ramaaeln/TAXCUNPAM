import { Navigate } from "react-router-dom";

export default function GuestAdminRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "adminToken"
    );

  if (token) {
    return (
      <Navigate
        to="/utcbt-internal/dashboard"
        replace
      />
    );
  }

  return children;
}