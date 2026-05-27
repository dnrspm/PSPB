import { createBrowserRouter, Navigate } from "react-router";
import UpdatedLandingPage from "../imports/UpdatedLandingPage";
import ContributionPage from "./pages/ContributionPage";
import ComponentShowcase from "./pages/ComponentShowcase";
import LoginPageWrapper from "./pages/LoginPageWrapper";
import WorkspaceLayout from "./pages/WorkspaceLayout";
import WorkspacePageWrapper from "./pages/WorkspacePageWrapper";
import ContributionDetailWrapper from "./pages/ContributionDetailWrapper";

// Error Fallback Component
function ErrorFallback() {
  return (
    <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)' }}>
        Terjadi Kesalahan
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
        Maaf, halaman yang Anda cari tidak ditemukan.
      </p>
      <a href="/" style={{ color: 'var(--primary)', marginTop: 'var(--spacing-4)', display: 'inline-block' }}>
        Kembali ke Beranda
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UpdatedLandingPage />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/kontribusi",
    element: <ContributionPage />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/komponen",
    element: <ComponentShowcase />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/login",
    element: <LoginPageWrapper />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/internal",
    element: <Navigate to="/workspace" replace />,
  },
  {
    path: "/workspace",
    element: <WorkspaceLayout />,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <WorkspacePageWrapper /> },
      { path: ":id", element: <ContributionDetailWrapper /> },
    ],
  },
]);

