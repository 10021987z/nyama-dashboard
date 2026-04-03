"use client";

import { useEffect, useState, useCallback } from "react";
import { getUser, isAuthenticated, logout as authLogout } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setLoading(false);

    if (!isAuthenticated()) {
      window.location.href = "/login";
    }
  }, []);

  const logout = useCallback(() => {
    authLogout();
  }, []);

  return { user, loading, logout, isAuthenticated: isAuthenticated() };
}
