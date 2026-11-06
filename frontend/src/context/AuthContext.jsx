import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [publicData, setPublicData] = useState({
    portal_settings: {
      institution_name: "[Configurable College Name — Set in Admin Settings]",
      initiative_subtitle: "An Initiative by SFI MACE Unit",
      campus_location: "[Configurable Campus Location — Set in Admin Settings]",
      official_contact_email: "womenscell@college-placeholder.edu.in",
      confidentiality_policy_summary: "",
    },
    helplines: [],
    categories: [],
  });

  const fetchPublicOverview = useCallback(async () => {
    try {
      const res = await apiClient.get("/public/overview/");
      if (res.data) {
        setPublicData(res.data);
      }
    } catch (_err) {
      // Keep default fallback
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("abhaya_access_token");
    if (!token) {
      setUser(null);
      setLoadingAuth(false);
      return;
    }
    try {
      const res = await apiClient.get("/auth/me/");
      setUser(res.data);
    } catch (_err) {
      localStorage.removeItem("abhaya_access_token");
      localStorage.removeItem("abhaya_refresh_token");
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicOverview();
    refreshCurrentUser();
  }, [fetchPublicOverview, refreshCurrentUser]);

  const loginStudent = async (email, password) => {
    const res = await apiClient.post("/auth/student/login/", { email, password });
    localStorage.setItem("abhaya_access_token", res.data.access);
    localStorage.setItem("abhaya_refresh_token", res.data.refresh);
    setUser(res.data.user);
    return res.data;
  };

  const loginAdmin = async (username, password) => {
    const res = await apiClient.post("/auth/admin/login/", {
      username,
      email: username,
      password,
    });
    localStorage.setItem("abhaya_access_token", res.data.access);
    localStorage.setItem("abhaya_refresh_token", res.data.refresh);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    const refresh = localStorage.getItem("abhaya_refresh_token");
    try {
      await apiClient.post("/auth/logout/", { refresh });
    } catch (_err) {
      // ignore
    }
    localStorage.removeItem("abhaya_access_token");
    localStorage.removeItem("abhaya_refresh_token");
    setUser(null);
  };

  const isStudent = user?.role === "STUDENT";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isStudent,
        isAdmin,
        loadingAuth,
        publicData,
        fetchPublicOverview,
        refreshCurrentUser,
        loginStudent,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
