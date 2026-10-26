import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/** Normalise role strings to a lower‑cased, underscore‑free form. */
const normaliseRole = (raw?: string): string => {
  if (!raw) return "";
  return raw.trim().toLowerCase().replace(/_/g, "");
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Keys must stay exactly "user" and "token".
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  // Re‑hydrate after a page refresh when we have a token but no user.
  useEffect(() => {
    if (token && !user) {
      const saved = localStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
    }
  }, [token, user]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    const data = await response.json(); // { access_token, user }
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const register = async (
    email: string,
    username: string,
    password: string,
  ): Promise<User> => {
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!response.ok) throw new Error("Registration failed");
    const data = await response.json(); // { access_token, user }
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ----- Role handling -------------------------------------------------
  const normalized = normaliseRole(user?.role);
  const isSuperAdmin = normalized === "superadmin";
  const isAdmin = isSuperAdmin || normalized === "admin";
  // --------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
