import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { Button } from "../ui/Button";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Must belong to a household (most app pages). */
  requireHousehold?: boolean;
  /** Kept for route call sites; onboarding stays reachable to add households. */
  onboardingOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requireHousehold = false,
}: ProtectedRouteProps) {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const household = useHouseholdStore((s) => s.household);
  const hasLoadedMine = useHouseholdStore((s) => s.hasLoadedMine);
  const householdError = useHouseholdStore((s) => s.error);
  const fetchMine = useHouseholdStore((s) => s.fetchMine);
  const [checkingHousehold, setCheckingHousehold] = useState(!hasLoadedMine);

  useEffect(() => {
    if (!isSignedIn || isLoading) {
      setCheckingHousehold(false);
      return;
    }
    // Avoid re-fetching on every page navigation - that raced with token refresh
    // and used to wipe household state on failure, kicking users to onboarding.
    if (hasLoadedMine) {
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
  }, [fetchMine, hasLoadedMine, isLoading, isSignedIn]);

  if (isLoading || checkingHousehold) {
    return <div className="route-loading">Loading…</div>;
  }

  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (requireHousehold && !household) {
    // Successful empty membership → onboarding. Failed load with no cache → retry.
    if (!hasLoadedMine && householdError) {
      return (
        <div className="route-loading" style={{ gap: 16, textAlign: "center", padding: 24 }}>
          <p>Couldn’t load your households. {householdError}</p>
          <Button
            type="button"
            onClick={() => {
              setCheckingHousehold(true);
              void fetchMine().finally(() => setCheckingHousehold(false));
            }}
          >
            Try again
          </Button>
        </div>
      );
    }
    if (hasLoadedMine) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
}
