import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Must belong to a household (most app pages). */
  requireHousehold?: boolean;
  /** Onboarding only — redirect away if a household already exists. */
  onboardingOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requireHousehold = false,
  onboardingOnly = false,
}: ProtectedRouteProps) {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const household = useHouseholdStore((s) => s.household);
  const fetchMine = useHouseholdStore((s) => s.fetchMine);
  const [checkingHousehold, setCheckingHousehold] = useState(true);

  useEffect(() => {
    if (!isSignedIn || isLoading) {
      setCheckingHousehold(false);
      return;
    }
    let active = true;
    setCheckingHousehold(true);
    void fetchMine().finally(() => {
      if (active) setCheckingHousehold(false);
    });
    return () => {
      active = false;
    };
  }, [fetchMine, isLoading, isSignedIn]);

  if (isLoading || checkingHousehold) {
    return <div className="route-loading">Loading…</div>;
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (requireHousehold && !household) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingOnly && household) {
    return <Navigate to="/inventory" replace />;
  }

  return children;
}
