import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Sparkles, 
  LogOut, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Send,
  Lock,
  ChevronRight,
  RefreshCw,
  Menu,
  X,
  Trophy,
  Home,
  FileText,
  Zap,
  ExternalLink
} from "lucide-react";
import { UserProfile, RedeemRequest, REDEEM_PACKAGES, RedeemPackage } from "../types";
import AdSimulator from "./AdSimulator";

interface DashboardProps {
  token: string;
  user: UserProfile;
  requests: RedeemRequest[];
  onRefresh: () => void;
  onLogout: () => void;
  onAdminLogin?: (token: string, user: any) => void;
}

export default function Dashboard({ token, user, requests, onRefresh, onLogout, onAdminLogin }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"home" | "leaderboard" | "withdraw" | "history">("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adModalType, setAdModalType] = useState<"reward" | "booster">("reward");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<RedeemPackage | null>(null);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submittingRedeem, setSubmittingRedeem] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [rewardToast, setRewardToast] = useState<string | null>(null);

  // Admin login states
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);

  // Time remaining countdown for booster
  const [boosterTimeStr, setBoosterTimeStr] = useState("00:00");

  // Leaderboard state
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaderboardUsers(data.users || []);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
      }
    };

    fetchLeaderboard();
  }, [user.coins]);

  useEffect(() => {
    if (!user.boosterUntil) {
      setBoosterTimeStr("00:00");
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = user.boosterUntil! - now;
      if (diff <= 0) {
        setBoosterTimeStr("00:00");
        clearInterval(interval);
        onRefresh();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setBoosterTimeStr(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.boosterUntil]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenTask = (type: "reward" | "booster") => {
    setAdModalType(type);
    setAdModalOpen(true);
  };

  const handleTaskFinished = async () => {
    setAdModalOpen(false);
    
    const endpoint = adModalType === "reward" 
      ? "/api/user/earn-coins" 
      : "/api/user/watch-booster-ad";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      });
      
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned response status ${response.status}`);
      }

      if (response.ok) {
        if (adModalType === "reward") {
          const earned = data.earned || (user.isBoosterActive ? 20 : 10);
          const newCoins = data.newCoins ?? (user.coins + earned);
          setRewardToast(`🎉 +${earned} Coins credited! New balance: ${newCoins.toLocaleString()} coins.`);
        } else {
          setRewardToast("🚀 2X Coin Booster activated! Double coins for 15 minutes.");
        }
        setTimeout(() => setRewardToast(null), 6000);
        onRefresh();
      } else {
        alert(data.error || "Failed to sync rewards. Please try again.");
      }
    } catch (err: any) {
      console.error("Task reward sync error:", err);
      alert(err.message || "Failed to sync rewards. Please check your connection.");
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);

    if (!selectedPackage || !paymentDetails.trim()) {
      setRedeemError("Please select a package and provide payment details.");
      return;
    }

    if (user.coins < selectedPackage.coins) {
      setRedeemError(`Insufficient coin balance. You need ${selectedPackage.coins} coins.`);
      return;
    }

    setSubmittingRedeem(true);

    try {
      const response = await fetch("/api/user/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: selectedPackage.amount,
          paymentDetails: paymentDetails.trim()
        })
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned response status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to process redeem request.");
      }

      setRedeemSuccess(`Redeem request for ${selectedPackage.amount} INR submitted successfully!`);
      setSelectedPackage(null);
      setPaymentDetails("");
      onRefresh();
    } catch (err: any) {
      setRedeemError(err.message || "An error occurred.");
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setLoggingInAdmin(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid administrator credentials.");
      }

      if (onAdminLogin) {
        onAdminLogin(data.token, data.user);
      }
      setAdminLoginOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch (err: any) {
      setAdminLoginError(err.message || "An unexpected error occurred during admin login.");
    } finally {
      setLoggingInAdmin(false);
    }
  };

  const maxMilestoneCoins = 19500;
  const progressPercentage = Math.min((user.coins / maxMilestoneCoins) * 100, 100);

  const milestones = [
    { name: "10 INR", coins: 2500, value: 10 },
    { name: "20 INR", coins: 4000, value: 20 },
    { name: "50 INR", coins: 10000, value: 50 },
    { name: "100 INR", coins: 19500, value: 100 },
  ];

  const nextMilestone = milestones.find(m => user.coins < m.coins) || null;

  // Default leaderboard users
  const defaultLeaderboard = [
    { rank: 1, email: "rahul.k****@gmail.com", coins: 45200, totalPaid: "200 INR" },
    { rank: 2, email: "sumit_earner****@gmail.com", coins: 38900, totalPaid: "150 INR" },
    { rank: 3, email: "priya_earn****@gmail.com", coins: 31000, totalPaid: "120 INR" },
    { rank: 4, email: "gamersujeet****@gmail.com", coins: 28500, totalPaid: "100 INR" },
    { rank: 5, email: "vikas_play****@gmail.com", coins: 22400, totalPaid: "80 INR" },
    { rank: 6, email: "deepak_pro****@gmail.com", coins: 19800, totalPaid: "70 INR" },
    { rank: 7, email: "ananya_free****@gmail.com", coins: 16500, totalPaid: "50 INR" },
    { rank: 8, email: "rohit_coder****@gmail.com", coins: 14200, totalPaid: "50 INR" },
    { rank: 9, email: "manish_win****@gmail.com", coins: 11900, totalPaid: "30 INR" },
    { rank: 10, email: "karan_app****@gmail.com", coins: 10500, totalPaid: "20 INR" },
  ];

  const displayLeaderboard = leaderboardUsers.length > 0 ? leaderboardUsers : defaultLeaderboard;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans pb-24">
      
      {/* Toast Notification Banner */}
      {rewardToast && (
        <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-300 z-30">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="animate-spin text-amber-200 shrink-0" />
            <span className="text-xs sm:text-sm font-black font-display tracking-wide">{rewardToast}</span>
          </div>
          <button 
            onClick={() => setRewardToast(null)} 
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-emerald-600 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Top Header with 3-Line Hamburger Menu on Top Left */}
      <header className="flex items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu 3 Line Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-11 h-11 rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 flex items-center justify-center transition shadow-md active:scale-95 shrink-0"
            title="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
              <Coins className="text-indigo-600 animate-pulse" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950 font-display tracking-tight flex items-center gap-1.5">
                <span>Fast Earn</span>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/15">
                  LIVE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[140px] sm:max-w-xs">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Coin Balance Badge */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-sm">
            <Coins size={15} />
            <span>{user.coins.toLocaleString()}</span>
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition"
            title="Sync Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* Slide-out Navigation Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="relative w-80 max-w-[80vw] bg-slate-900 text-white h-full shadow-2xl p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                    <Coins size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base font-display">Fast Earn App</h3>
                    <p className="text-xs text-slate-400 font-mono">Navigation Menu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer User Info Card */}
              <div className="mt-6 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Current Balance</span>
                  <span className="text-emerald-400 font-bold font-mono">₹{((user.coins / 2500) * 10).toFixed(2)}</span>
                </div>
                <div className="text-xl font-black font-display text-amber-400 flex items-center gap-1.5">
                  <Coins size={20} />
                  <span>{user.coins.toLocaleString()} Coins</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="mt-8 space-y-2">
                <button
                  onClick={() => { setActiveTab("home"); setIsMenuOpen(false); }}
                  className={`w-full p-3.5 rounded-2xl font-bold text-xs flex items-center gap-3 transition ${
                    activeTab === "home"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Home size={18} />
                  <span>Home Dashboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab("leaderboard"); setIsMenuOpen(false); }}
                  className={`w-full p-3.5 rounded-2xl font-bold text-xs flex items-center gap-3 transition ${
                    activeTab === "leaderboard"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Trophy size={18} />
                  <span>Leaderboard</span>
                </button>

                <button
                  onClick={() => { setActiveTab("withdraw"); setIsMenuOpen(false); }}
                  className={`w-full p-3.5 rounded-2xl font-bold text-xs flex items-center gap-3 transition ${
                    activeTab === "withdraw"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Gift size={18} />
                  <span>Withdraw Zone</span>
                </button>

                <button
                  onClick={() => { setActiveTab("history"); setIsMenuOpen(false); }}
                  className={`w-full p-3.5 rounded-2xl font-bold text-xs flex items-center gap-3 transition ${
                    activeTab === "history"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <FileText size={18} />
                  <span>History</span>
                </button>

                <a
                  href="https://omg10.com/4/11383535"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl font-bold text-xs flex items-center justify-between bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-amber-400" />
                    <span>Special Sponsor Offer</span>
                  </div>
                  <ExternalLink size={14} className="text-amber-400 group-hover:translate-x-0.5 transition" />
                </a>
              </nav>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="pt-6 border-t border-slate-800 space-y-2">
              <button
                onClick={() => { setIsMenuOpen(false); setAdminLoginOpen(true); }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Lock size={14} />
                <span>Admin Portal</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut size={14} />
                <span>Reset Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Content Display */}
      {activeTab === "home" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Main Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-indigo-500/30 inline-block mb-3">
                  Live Coin Balance
                </span>
                <h3 className="text-3xl font-black font-display tracking-tight text-white flex items-center gap-2">
                  <span>{user.coins.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-slate-400 font-mono">Coins</span>
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Estimated Cash Value: <strong className="text-emerald-400 font-bold">₹{((user.coins / 2500) * 10).toFixed(2)} INR</strong>
                  {nextMilestone && (
                    <> • Need <strong className="text-amber-400">{(nextMilestone.coins - user.coins).toLocaleString()}</strong> more coins for {nextMilestone.name}</>
                  )}
                </p>
              </div>

              {/* Main "Get Coins" Action Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleOpenTask("reward")}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xs px-7 py-4 rounded-2xl flex items-center justify-center gap-2.5 transition transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-500/20 shrink-0 cursor-pointer"
                >
                  <Coins size={18} className="text-amber-300 animate-bounce" />
                  <span>Get Coins (+10 Coins)</span>
                </button>

                <button
                  onClick={() => setActiveTab("withdraw")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-600/20 shrink-0 cursor-pointer"
                >
                  <Gift size={16} />
                  <span>Withdraw Coins</span>
                </button>
              </div>
            </div>

            {/* Progress Bar to Milestone */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono font-bold">
                <span>Progress to ₹100 INR Limit</span>
                <span className="text-amber-400">{progressPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats & Booster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Get Coins Card Zone */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-100 transition">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Coins size={22} />
                </div>
                <h4 className="text-base font-black text-slate-900 font-display">Fast Coin Task</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Complete the 10-second timer and scroll task to receive {user.isBoosterActive ? <strong className="text-emerald-600">20 Coins (2x Multiplier)</strong> : <strong>10 Coins</strong>}.
                </p>
              </div>

              <button
                onClick={() => handleOpenTask("reward")}
                className="mt-6 w-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black py-3.5 rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Get Coins Now</span>
              </button>
            </div>

            {/* 2x Booster Card Zone */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-100 transition">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap size={22} />
                  </div>
                  {user.isBoosterActive ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                      <Sparkles size={10} className="animate-spin text-amber-500" />
                      Active 2x Multiplier
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold">
                      Inactive
                    </span>
                  )}
                </div>

                {user.isBoosterActive ? (
                  <div>
                    <span className="text-2xl font-black text-slate-900 font-display">
                      {boosterTimeStr}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Double coin boost active! You earn <strong>20 coins</strong> per task!
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-base font-black text-slate-900 font-display">2x Coin Multiplier</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Complete a 10s task to activate double coins on all future claims for 15 minutes!
                    </p>
                  </div>
                )}
              </div>

              {!user.isBoosterActive && (
                <button
                  onClick={() => handleOpenTask("booster")}
                  className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 rounded-2xl transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap size={14} />
                  <span>Activate 2x Multiplier</span>
                </button>
              )}
            </div>

          </div>

          {/* Featured Sponsor Offer Direct Link Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-400">
            <div>
              <span className="text-[10px] bg-slate-950 text-amber-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1.5">
                🔥 Featured Sponsor Offer
              </span>
              <h4 className="text-base font-black font-display text-slate-950">
                Explore Direct Partner Offer
              </h4>
              <p className="text-xs font-medium text-slate-900 mt-0.5">
                Click below to open our verified sponsor deal in a new tab!
              </p>
            </div>

            <a
              href="https://omg10.com/4/11383535"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 shadow-md transition shrink-0 group"
            >
              <span>Visit Partner Deal</span>
              <ExternalLink size={15} className="group-hover:translate-x-0.5 transition" />
            </a>
          </div>

          {/* Direct Link to Leaderboard & Withdraw */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 text-left hover:bg-slate-800 transition flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                  Top Earners Board
                </span>
                <h4 className="text-base font-black font-display flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  <span>View Leaderboard</span>
                </h4>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => setActiveTab("withdraw")}
              className="bg-indigo-600 text-white p-6 rounded-3xl text-left hover:bg-indigo-700 transition flex items-center justify-between group shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 block mb-1">
                  Cash Out Station
                </span>
                <h4 className="text-base font-black font-display flex items-center gap-2">
                  <Gift size={18} className="text-amber-300" />
                  <span>Withdraw Rewards</span>
                </h4>
              </div>
              <ChevronRight size={18} className="text-indigo-200 group-hover:translate-x-1 transition" />
            </button>
          </div>

        </div>
      )}

      {/* LEADERBOARD TAB ZONE */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={28} className="text-slate-950" />
              <h2 className="text-2xl font-black font-display tracking-tight">Top Earners Leaderboard</h2>
            </div>
            <p className="text-xs text-slate-900 font-semibold max-w-xl">
              Compete with other users to reach the top ranking! Rankings are updated live based on total coins earned.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <div className="space-y-3">
              {displayLeaderboard.map((item, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                      isTop1
                        ? "bg-amber-500/10 border-amber-300 text-slate-900"
                        : isTop2
                        ? "bg-slate-100/80 border-slate-300 text-slate-900"
                        : isTop3
                        ? "bg-orange-500/10 border-orange-300 text-slate-900"
                        : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                        isTop1
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : isTop2
                          ? "bg-slate-300 text-slate-800"
                          : isTop3
                          ? "bg-orange-400 text-white"
                          : "bg-slate-200 text-slate-600 font-mono"
                      }`}>
                        {index + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs font-mono">{item.email}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold">Verified Earner</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-sm text-slate-900 flex items-center gap-1 justify-end">
                        <Coins size={14} className="text-amber-500" />
                        <span>{item.coins.toLocaleString()} Coins</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 font-mono">
                        Total Paid: {item.totalPaid || "₹50 INR"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW TAB ZONE */}
      {activeTab === "withdraw" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="text-xl font-black text-slate-900 font-display tracking-tight flex items-center gap-2">
                <Gift size={22} className="text-indigo-600" />
                <span>Withdrawal Station</span>
              </h2>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 font-bold">
                Manual Payout
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Exchange your earned coins for Google Play Gift Codes, Paytm Cash, or UPI transfers!
            </p>

            {redeemError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{redeemError}</span>
              </div>
            )}
            {redeemSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>{redeemSuccess}</span>
              </div>
            )}

            {/* Selected Package Form */}
            {selectedPackage ? (
              <form onSubmit={handleRedeemSubmit} className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                      Selected Package
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-0.5">
                      ₹{selectedPackage.amount} INR Reward Code / Cash
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Coins Required</span>
                    <span className="text-sm font-bold text-slate-950 font-mono bg-white border border-indigo-100 px-3 py-1 rounded-xl">
                      {selectedPackage.coins} Coins
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Your Paytm Number / UPI ID / PhonePe Number
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="e.g. Paytm: 9876543210 or UPI: gamersujeet@okaxis"
                    className="w-full bg-white border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 text-xs outline-none text-slate-900 font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    Verify your payment details carefully before submitting!
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackage(null);
                      setPaymentDetails("");
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRedeem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{submittingRedeem ? "Submitting..." : "Submit Withdrawal Request"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {REDEEM_PACKAGES.map((pkg) => {
                  const canAfford = user.coins >= pkg.coins;
                  return (
                    <div 
                      key={pkg.amount} 
                      className={`border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                        canAfford 
                          ? "border-emerald-200 bg-emerald-50/10 hover:border-emerald-500 hover:shadow-md cursor-pointer" 
                          : "border-slate-100 bg-slate-50/50 opacity-80"
                      }`}
                      onClick={() => {
                        if (canAfford) {
                          setSelectedPackage(pkg);
                        } else {
                          setRedeemError(`You need at least ${pkg.coins} coins to redeem ${pkg.amount} INR.`);
                        }
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm px-3 py-1 rounded-xl font-black ${
                            canAfford ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700"
                          }`}>
                            ₹{pkg.amount} INR
                          </span>
                          <span className="text-xs text-slate-600 font-mono font-bold">
                            {pkg.coins.toLocaleString()} Coins
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          Google Play Code, Paytm Cash, or instant UPI payout.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`mt-5 w-full text-xs font-bold py-3 rounded-2xl transition text-center ${
                          canAfford
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/10"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {canAfford ? "Withdraw Now" : `Need ${pkg.coins - user.coins} more coins`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB ZONE */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 font-display tracking-tight mb-2 flex items-center gap-2">
              <FileText size={22} className="text-indigo-600" />
              <span>Redemption History</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Track your past withdrawal requests and view your processed Google Play codes!
            </p>

            {requests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Gift size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">No requests submitted yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Accumulate coins in Home and submit a withdrawal request!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">
                        ₹{req.amount} INR Request
                      </span>
                      
                      {req.status === "pending" && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold">
                          Pending Admin Approval
                        </span>
                      )}
                      {req.status === "completed" && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                          Paid Out / Completed
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full font-bold">
                          Rejected (Coins Refunded)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Request ID: {req.id}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                      <strong>Target Details:</strong> {req.paymentDetails}
                    </p>

                    {req.status === "completed" && req.redeemCode && (
                      <div className="pt-2 border-t border-dashed border-slate-200 flex flex-col gap-1.5">
                        <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">
                          Your Google Play Redeem Code:
                        </span>
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-mono text-xs text-emerald-900">
                          <span className="font-bold select-all overflow-hidden truncate">
                            {req.redeemCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(req.redeemCode!, req.id)}
                            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100 transition shrink-0"
                            title="Copy Code"
                          >
                            {copiedId === req.id ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM FIXED NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 py-2.5 px-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === "home" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${activeTab === "home" ? "bg-indigo-50" : ""}`}>
              <Home size={20} />
            </div>
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === "leaderboard" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${activeTab === "leaderboard" ? "bg-indigo-50" : ""}`}>
              <Trophy size={20} />
            </div>
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab("withdraw")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === "withdraw" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${activeTab === "withdraw" ? "bg-indigo-50" : ""}`}>
              <Gift size={20} />
            </div>
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition cursor-pointer ${
              activeTab === "history" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${activeTab === "history" ? "bg-indigo-50" : ""}`}>
              <FileText size={20} />
            </div>
            <span>History</span>
          </button>

        </div>
      </nav>

      {/* Task Timer Modal */}
      <AdSimulator 
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        onReward={handleTaskFinished}
        adType={adModalType}
      />

      {/* Admin Login Modal Overlay */}
      {adminLoginOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Lock size={16} />
                </div>
                <h3 className="font-bold text-slate-900">Admin Authorization Portal</h3>
              </div>
              <button 
                onClick={() => { setAdminLoginOpen(false); setAdminLoginError(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              {adminLoginError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{adminLoginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Security Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loggingInAdmin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {loggingInAdmin ? "Authorizing..." : "Authorize & Enter Admin Panel"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
