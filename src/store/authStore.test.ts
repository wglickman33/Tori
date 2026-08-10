import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isSignedIn: false,
      isLoading: false,
    });
  });

  it("stores session tokens on sign in", () => {
    useAuthStore.getState().signIn(
      { id: "1", email: "a@b.com", displayName: "A" },
      "access",
      "refresh"
    );
    expect(localStorage.getItem("tori_access_token")).toBe("access");
    expect(localStorage.getItem("tori_refresh_token")).toBe("refresh");
    expect(useAuthStore.getState().isSignedIn).toBe(true);
  });
});
