import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import InventoryPage from "./pages/InventoryPage";
import DashboardPage from "./pages/DashboardPage";
import SearchPage from "./pages/SearchPage";
import TagsPage from "./pages/TagsPage";
import LocationsPage from "./pages/LocationsPage";
import ExpiringPage from "./pages/ExpiringPage";
import ValuePage from "./pages/ValuePage";
import HouseholdPage from "./pages/HouseholdPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./store/authStore";

function RootRedirect() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) return <div className="route-loading">Loading…</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <Navigate to="/inventory" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute onboardingOnly>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute requireHousehold>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/:id"
          element={
            <ProtectedRoute requireHousehold>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireHousehold>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute requireHousehold>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tags"
          element={
            <ProtectedRoute requireHousehold>
              <TagsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute requireHousehold>
              <LocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expiring"
          element={
            <ProtectedRoute requireHousehold>
              <ExpiringPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/value"
          element={
            <ProtectedRoute requireHousehold>
              <ValuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/household"
          element={
            <ProtectedRoute requireHousehold>
              <HouseholdPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
