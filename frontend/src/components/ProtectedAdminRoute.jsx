import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "adminToken"
    );

  if (!token) {
    return (
      <Navigate
        to="/utcbt-internal"
        replace
      />
    );
  }

  return children;
}