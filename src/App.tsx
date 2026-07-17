import React, { useState, useEffect, useCallback } from "react";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import { UserProfile, RedeemRequest } from "./types";
import { Coins, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<RedeemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for saved session on load
  useEffect(() => {
    const savedToken = localStorage.getItem("redeem_app_token");
    const savedUser = localStorage.getItem("redeem_app_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUserProfile(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Fetch updated user profile & requests from backend
  const fetchProfileData = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setUserProfile(data.user);
          setRequests(data.requests);
          localStorage.setItem("redeem_app_user", JSON.stringify(data.user));
        } else {
          console.warn("Profile sync returned non-JSON response");
        }
      } else {
        // Token might have expired or user was deleted
        handleLogout();
      }
    } catch (error) {
      console.error("Error synchronizing profile details:", error);
    }
  }, [token]);

  // Sync profile when token is updated or when refresh trigger changes
  useEffect(() => {
    if (token) {
      fetchProfileData();
    }
  }, [token, refreshTrigger, fetchProfileData]);

  // Periodic polling to keep coin balance & payout status perfectly in-sync
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchProfileData();
    }, 15000); // Sync every 15 seconds

    return () => clearInterval(interval);
  }, [token, fetchProfileData]);

  const handleLoginSuccess = (
    authToken: string,
    profile: { id: string; email: string; isAdmin: boolean }
  ) => {
    localStorage.setItem("redeem_app_token", authToken);
    // Create preliminary user state
    const initialProfile: UserProfile = {
      ...profile,
      coins: 0,
      boosterUntil: null,
      isBoosterActive: false,
      boosterTimeRemaining: 0,
    };
    localStorage.setItem("redeem_app_user", JSON.stringify(initialProfile));
    setToken(authToken);
    setUserProfile(initialProfile);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem("redeem_app_token");
    localStorage.removeItem("redeem_app_user");
    setToken(null);
    setUserProfile(null);
    setRequests([]);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-spin">
            <Coins size={24} />
          </div>
          <span className="text-xs font-semibold text-slate-500 tracking-wide animate-pulse">
            Connecting to secure servers...
          </span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication Flow
  if (!token || !userProfile) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in as Administrator -> Show Admin Panel
  if (userProfile.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top Banner Alert indicating Admin Mode */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-400 animate-pulse" />
          <span>System Administrator Authorized View</span>
        </div>
        
        <AdminPanel
          token={token}
          adminProfile={userProfile}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Logged in as Standard User -> Show Earnings Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Welcome Alert Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-amber-400 animate-bounce" />
        <span>Watch Sponsor Video Ads to claim real Google Play Codes & Paytm Cash!</span>
      </div>

      <Dashboard
        token={token}
        user={userProfile}
        requests={requests}
        onRefresh={triggerRefresh}
        onLogout={handleLogout}
      />
    </div>
  );
}
