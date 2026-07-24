import React, { useState, useEffect, useCallback } from "react";
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

  // Check for saved session or trigger auto-login on load
  useEffect(() => {
    const initSession = async () => {
      const savedToken = localStorage.getItem("redeem_app_token");
      const savedUser = localStorage.getItem("redeem_app_user");

      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const now = Date.now();
          const isBoosterActive = parsed.boosterUntil ? parsed.boosterUntil > now : false;
          setUserProfile({
            ...parsed,
            isBoosterActive,
            boosterTimeRemaining: isBoosterActive ? Math.max(0, parsed.boosterUntil - now) : 0,
          });
          setToken(savedToken);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing saved user:", e);
        }
      }

      // Try auto-login API with fallback to local guest session on static hosts like Vercel
      try {
        const response = await fetch("/api/auth/auto-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: savedToken }),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          localStorage.setItem("redeem_app_token", data.token);
          const initialProfile: UserProfile = {
            ...data.user,
            isBoosterActive: false,
            boosterTimeRemaining: 0,
          };
          localStorage.setItem("redeem_app_user", JSON.stringify(initialProfile));
          setToken(data.token);
          setUserProfile(initialProfile);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend auto-login unavailable, initializing local session:", err);
      }

      // Fallback local guest session for Vercel static deploys or offline servers
      const guestId = Math.random().toString(36).substring(2, 10);
      const fallbackUser: UserProfile = {
        id: `user_${guestId}`,
        email: `earner_${guestId}@gmail.com`,
        isAdmin: false,
        coins: 0,
        boosterUntil: null,
        isBoosterActive: false,
        boosterTimeRemaining: 0,
      };
      localStorage.setItem("redeem_app_token", `token_${guestId}`);
      localStorage.setItem("redeem_app_user", JSON.stringify(fallbackUser));
      setToken(`token_${guestId}`);
      setUserProfile(fallbackUser);
      setLoading(false);
    };

    initSession();
  }, []);

  // Fetch updated user profile & requests from backend with local fallback
  const fetchProfileData = useCallback(async () => {
    let synced = false;

    if (token) {
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setUserProfile(data.user);
          setRequests(data.requests || []);
          localStorage.setItem("redeem_app_user", JSON.stringify(data.user));
          if (data.requests) {
            localStorage.setItem("redeem_app_requests", JSON.stringify(data.requests));
          }
          synced = true;
        }
      } catch (error) {
        console.warn("Backend profile sync unavailable, reading from local state:", error);
      }
    }

    // Local fallback when backend API is unavailable (e.g. Vercel static hosting)
    if (!synced) {
      const localUserRaw = localStorage.getItem("redeem_app_user");
      if (localUserRaw) {
        try {
          const parsed = JSON.parse(localUserRaw);
          const now = Date.now();
          const isBoosterActive = parsed.boosterUntil ? parsed.boosterUntil > now : false;
          setUserProfile({
            ...parsed,
            isBoosterActive,
            boosterTimeRemaining: isBoosterActive ? Math.max(0, parsed.boosterUntil - now) : 0,
          });
        } catch (e) {
          console.error("Failed to parse local user profile:", e);
        }
      }

      const localReqsRaw = localStorage.getItem("redeem_app_requests");
      if (localReqsRaw) {
        try {
          setRequests(JSON.parse(localReqsRaw));
        } catch (e) {
          console.error("Failed to parse local requests:", e);
        }
      }
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
    profile: { id: string; email: string; isAdmin: boolean; coins?: number; boosterUntil?: number | null }
  ) => {
    localStorage.setItem("redeem_app_token", authToken);
    // Create preliminary user state
    const initialProfile: UserProfile = {
      ...profile,
      coins: profile.coins ?? 0,
      boosterUntil: profile.boosterUntil ?? null,
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
    // Clear cookies
    document.cookie = "earn_token=; path=/; max-age=0;";
    setToken(null);
    setUserProfile(null);
    setRequests([]);
    // Reload to trigger automatic clean anonymous account generation
    window.location.reload();
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

  // Safe default guest profile if server auto-login is delayed or offline, so user never faces any authorization screens
  const effectiveProfile: UserProfile = userProfile || {
    id: "guest",
    email: "guest@earner.com",
    isAdmin: false,
    coins: 0,
    boosterUntil: null,
    isBoosterActive: false,
    boosterTimeRemaining: 0,
  };
  const effectiveToken = token || "guest";

  // Logged in as Administrator -> Show Admin Panel
  if (effectiveProfile.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top Banner Alert indicating Admin Mode */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-400 animate-pulse" />
          <span>System Administrator Authorized View</span>
        </div>
        
        <AdminPanel
          token={effectiveToken}
          adminProfile={effectiveProfile}
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
        <span>Complete 10-second tasks & claim real Google Play Codes & Paytm Cash!</span>
      </div>

      <Dashboard
        token={effectiveToken}
        user={effectiveProfile}
        requests={requests}
        onRefresh={triggerRefresh}
        onLogout={handleLogout}
        onAdminLogin={handleLoginSuccess}
      />
    </div>
  );
}
