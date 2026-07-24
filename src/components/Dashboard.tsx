import React, { useState, useEffect, useRef } from "react";
import { 
  Coins, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  LogOut, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  CreditCard,
  Send,
  HelpCircle,
  PlayCircle,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  RefreshCw
} from "lucide-react";
import { UserProfile, RedeemRequest, REDEEM_PACKAGES, RedeemPackage } from "../types";
import AdSimulator from "./AdSimulator";
import AdSenseUnit from "./AdSenseUnit";

interface DashboardProps {
  token: string;
  user: UserProfile;
  requests: RedeemRequest[];
  onRefresh: () => void;
  onLogout: () => void;
  onAdminLogin?: (token: string, user: any) => void;
}

export default function Dashboard({ token, user, requests, onRefresh, onLogout, onAdminLogin }: DashboardProps) {
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

  // Time remaining countdown in seconds
  const [boosterTimeStr, setBoosterTimeStr] = useState("00:00");
  const redeemSectionRef = useRef<HTMLDivElement | null>(null);

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
        onRefresh(); // Trigger profile reload to deactivate booster
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

  const handleOpenAd = (type: "reward" | "booster") => {
    setAdModalType(type);
    setAdModalOpen(true);
  };

  const handleAdFinished = async () => {
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
          setRewardToast("🚀 2X Coin Booster activated! You now earn double coins for 15 minutes.");
        }
        setTimeout(() => setRewardToast(null), 6000);
        onRefresh();
      } else {
        alert(data.error || "Failed to sync rewards. Please try again.");
      }
    } catch (err: any) {
      console.error("Ad reward synchronization error:", err);
      alert(err.message || "Failed to sync rewards. Please check your network connection.");
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

  const scrollToRedeem = () => {
    if (redeemSectionRef.current) {
      redeemSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate current progress width based on max milestone coins (19,500)
  const maxMilestoneCoins = 19500;
  const progressPercentage = Math.min((user.coins / maxMilestoneCoins) * 100, 100);

  // Find next milestone and remaining coins
  const milestones = [
    { name: "10 INR", coins: 2500, value: 10 },
    { name: "20 INR", coins: 4000, value: 20 },
    { name: "50 INR", coins: 10000, value: 50 },
    { name: "100 INR", coins: 19500, value: 100 },
  ];

  const nextMilestone = milestones.find(m => user.coins < m.coins) || null;
  const activeMilestonesCount = milestones.filter(m => user.coins >= m.coins).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* Toast Notification Banner */}
      {rewardToast && (
        <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-300">
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

      {/* Navigation Top Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
            <Coins className="text-indigo-600 animate-pulse" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950 font-display tracking-tight flex items-center gap-2">
              <span>Fast Earn Dashboard</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/15">
                ● LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Account: <span className="text-slate-600 font-semibold">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={onRefresh}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 border border-slate-100"
          >
            <RefreshCw size={13} className="animate-spin text-slate-400" />
            <span>Sync Data</span>
          </button>

          <button
            onClick={() => setAdminLoginOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold transition border border-indigo-100/50"
          >
            <Lock size={13} />
            <span>Admin Portal</span>
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2.5 rounded-xl font-bold transition"
            title="Reset Session and create a fresh new account"
          >
            <LogOut size={14} />
            <span>Reset Session</span>
          </button>
        </div>
      </header>

      {/* FANTASTIC NEW SECTION: Interactive Balance & Redemption Milestone Progress Track */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-indigo-500/30">
                Live Earnings Line
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-amber-500/30 flex items-center gap-1">
                <Sparkles size={10} />
                Pub-9048277633959630
              </span>
            </div>
            <h3 className="text-3xl font-black font-display tracking-tight text-white flex items-center gap-2">
              <span>{user.coins.toLocaleString()}</span>
              <span className="text-sm font-semibold text-slate-400 font-mono">Coins Accumulated</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Info size={13} className="text-indigo-400 shrink-0" />
              <span>
                Estimated Value: <strong className="text-emerald-400 font-bold">₹{((user.coins / 2500) * 10).toFixed(2)} INR</strong>. 
                {nextMilestone ? (
                  <> Need <strong className="text-amber-400">{(nextMilestone.coins - user.coins).toLocaleString()}</strong> more to withdraw {nextMilestone.name}.</>
                ) : (
                  <> You have achieved all withdrawal milestones! Request payout below.</>
                )}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleOpenAd("reward")}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/10 shrink-0"
            >
              <PlayCircle size={15} />
              <span>Watch Video Ad (+10 Coins)</span>
            </button>

            <button
              onClick={scrollToRedeem}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/10 shrink-0"
            >
              <Gift size={15} />
              <span>Go to Withdrawal Box</span>
            </button>
          </div>
        </div>

        {/* Milestone Tick Line Layout */}
        <div className="mt-8 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono font-bold">
            <span>Progress to ₹100 INR Limit</span>
            <span className="text-amber-400">{progressPercentage.toFixed(1)}% Completed</span>
          </div>

          {/* Progress track */}
          <div className="relative h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            {/* Active filled line */}
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Interactive Tick Marks */}
          <div className="grid grid-cols-4 gap-2 mt-4 relative">
            {milestones.map((milestone, idx) => {
              const isUnlocked = user.coins >= milestone.coins;
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (isUnlocked) {
                      const pkg = REDEEM_PACKAGES.find(p => p.amount === milestone.value);
                      if (pkg) {
                        setSelectedPackage(pkg);
                        scrollToRedeem();
                      }
                    }
                  }}
                  className={`flex flex-col p-3 rounded-2xl border transition-all cursor-pointer ${
                    isUnlocked 
                      ? "bg-slate-900/80 border-emerald-500/30 hover:border-emerald-500 text-white" 
                      : "bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider font-display">
                      ₹{milestone.value} INR
                    </span>
                    {isUnlocked ? (
                      <Unlock size={11} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Lock size={11} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-100 mt-0.5">
                    {milestone.coins.toLocaleString()} <span className="text-[9px] font-normal text-slate-400 font-sans">coins</span>
                  </span>
                  
                  <div className="mt-2 flex items-center justify-between text-[9px] font-semibold">
                    <span className={isUnlocked ? "text-emerald-400" : "text-slate-500"}>
                      {isUnlocked ? "Ready to Withdraw" : "Locked"}
                    </span>
                    {isUnlocked && <ChevronRight size={10} className="text-slate-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Explanation of Earning Flow */}
        <div className="mt-6 bg-indigo-950/40 border border-indigo-500/10 p-4 rounded-2xl flex items-start gap-3">
          <HelpCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">How do I earn real cash?</strong> When you watch video advertisements, our systems deliver traffic to Google AdSense partner code <strong>pub-9048277633959630</strong>. This pays actual revenue into the reserve pool. That's why we can hand over real manual Paytm cash, UPI payouts, and Google Play Redeem Codes. Keep watching and claiming!
          </div>
        </div>

      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Main Console */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Real Balance Info Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10">
                <Coins size={150} />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
                    Your Spendable Balance
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold tracking-tight font-display">
                      {user.coins.toLocaleString()}
                    </span>
                    <span className="text-xs text-indigo-200 font-mono">coins</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-indigo-500/50 flex items-center justify-between text-xs text-indigo-100">
                  <span>Available Cash Value:</span>
                  <strong className="text-emerald-300 font-bold text-sm font-mono">₹{((user.coins / 2500) * 10).toFixed(2)} INR</strong>
                </div>
              </div>
            </div>

            {/* Booster Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    2x Coin Booster Status
                  </span>
                  {user.isBoosterActive ? (
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Sparkles size={10} className="animate-spin" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-semibold">
                      Inactive
                    </span>
                  )}
                </div>

                {user.isBoosterActive ? (
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-900 font-display">
                      {boosterTimeStr}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      You are earning <strong className="text-indigo-600">20 coins</strong> per ad instead of 10!
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-slate-700 block">
                      No Booster Active
                    </span>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Watch a premium booster ad to unlock double coin payouts on all actions for 15 minutes!
                    </p>
                  </div>
                )}
              </div>

              {!user.isBoosterActive && (
                <button
                  onClick={() => handleOpenAd("booster")}
                  className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-amber-100 hover:shadow-amber-200 active:scale-95"
                >
                  <Sparkles size={12} />
                  <span>Activate 2x Booster Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Earning Area */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 font-display tracking-tight mb-2 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <span>Sponsor Video Earning Zone</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Watch official advertisement media to claim rewards. No daily limit—enjoy continuous credits!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Std Ad Button */}
              <div className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 hover:bg-indigo-50/20 transition group flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Coins size={18} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Standard Advertisement</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Watch a 15s advertisement to claim {user.isBoosterActive ? <span className="text-emerald-600 font-bold">20 Coins (2x)</span> : <span className="text-slate-600 font-bold">10 Coins</span>}.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAd("reward")}
                  className="mt-4 w-full bg-slate-900 text-white hover:bg-indigo-600 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Watch Ad & Claim Coins
                </button>
              </div>

              {/* Booster Ad Button */}
              <div className="border border-slate-100 rounded-2xl p-5 hover:border-amber-100 hover:bg-amber-50/20 transition group flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Sparkles size={18} className="group-hover:animate-bounce" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Premium Booster Ad</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Watch a specialized sponsor ad to claim or extend your 2x earning multiplier (+15 mins).
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAd("booster")}
                  className="mt-4 w-full bg-amber-500 text-white hover:bg-amber-600 text-xs font-semibold py-2.5 rounded-xl transition shadow-sm shadow-amber-50"
                >
                  Watch & Trigger 2x Boost
                </button>
              </div>
            </div>
          </section>

          {/* Redemption Area */}
          <section ref={redeemSectionRef} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm scroll-mt-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h3 className="text-base font-bold text-slate-900 font-display tracking-tight flex items-center gap-2">
                <Gift size={18} className="text-indigo-600" />
                <span>Withdrawal Station & Store</span>
              </h3>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                Manual Payout Process
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Select an unlocked bundle below. Provide accurate payment coordinates to request your manual code code or cashback!
            </p>

            {/* Error & Success Alerts */}
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

            {/* Selected Package Action Panel */}
            {selectedPackage ? (
              <form onSubmit={handleRedeemSubmit} className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 mb-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                      Selected Exchange Bundle
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                      {selectedPackage.amount} INR Code
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Coins Required</span>
                    <span className="text-sm font-bold text-slate-950 font-mono bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                      {selectedPackage.coins} Coins
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">
                    Your Paytm Number / UPI ID / PhonePe Number
                  </label>
                  <input
                    type="text"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="e.g. Paytm: 9876543210 or UPI: gamersujeet@okaxis"
                    className="w-full bg-white border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-900 font-semibold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1.5 block leading-relaxed">
                    Double-check your credentials! The admin processes payouts manually and uploads redeem code updates to your History column.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPackage(null);
                      setPaymentDetails("");
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition"
                  >
                    Cancel Selection
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRedeem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Send size={12} />
                    <span>{submittingRedeem ? "Submitting Request..." : "Submit Claim Request"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {REDEEM_PACKAGES.map((pkg) => {
                  const canAfford = user.coins >= pkg.coins;
                  return (
                    <div 
                      key={pkg.amount} 
                      className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                        canAfford 
                          ? "border-emerald-200 bg-emerald-50/10 hover:border-emerald-500 hover:shadow-md cursor-pointer" 
                          : "border-slate-100 bg-slate-50/30 opacity-75 hover:opacity-100"
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
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-black ${
                            canAfford ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700"
                          }`}>
                            {pkg.amount} INR
                          </span>
                          <span className="text-xs text-slate-600 font-mono font-bold">
                            {pkg.coins} Coins
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                          Google Play Gift Code or manual cash transfer.
                        </p>
                      </div>

                      <button
                        type="button"
                        className={`mt-4 w-full text-xs font-bold py-2 rounded-lg transition text-center ${
                          canAfford
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAfford) {
                            setSelectedPackage(pkg);
                          } else {
                            setRedeemError(`You need at least ${pkg.coins} coins to redeem ${pkg.amount} INR.`);
                          }
                        }}
                      >
                        {canAfford ? "Request Withdrawal" : `Need ${pkg.coins - user.coins} more coins`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Extra Ad unit under packages */}
            <AdSenseUnit format="horizontal" responsive={true} slot="4567890123" />
          </section>

        </div>

        {/* Column 3: History & Live Google Adsense display */}
        <div className="space-y-8">
          
          {/* Real Google AdSense Banner (Sticky Sidebar aspect) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
            <p className="text-center text-[10px] text-indigo-600 font-bold mb-1 uppercase tracking-widest font-display">
              Support Our Reserves Pool
            </p>
            <p className="text-center text-[10px] text-slate-400 mb-2 leading-relaxed">
              Every display ad loaded or clicked directly funds our reserve, maintaining faster manual admin payouts!
            </p>
            <AdSenseUnit format="rectangle" responsive={true} slot="5678901234" />
          </div>

          {/* User Requests list */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-indigo-600" />
              <span>Redemption History</span>
            </h3>

            {requests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">No requests submitted yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Accumulate coins and request cash codes above!</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {requests.map((req) => (
                  <div key={req.id} className="border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {req.amount} INR Request
                      </span>
                      
                      {req.status === "pending" && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md font-semibold">
                          Pending Approval
                        </span>
                      )}
                      {req.status === "completed" && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                          Paid Out
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md font-semibold">
                          Rejected (Refunded)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ID: {req.id}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                      <strong className="text-slate-600">Details:</strong> {req.paymentDetails}
                    </p>

                    {req.status === "completed" && req.redeemCode && (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex flex-col gap-1.5">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          Your Redeem Code:
                        </span>
                        <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 font-mono text-[11px] text-emerald-800">
                          <span className="font-bold select-all overflow-hidden truncate max-w-[150px]">
                            {req.redeemCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(req.redeemCode!, req.id)}
                            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-100 transition"
                            title="Copy Code"
                          >
                            {copiedId === req.id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* Ad Simulator Modal Overlay */}
      <AdSimulator 
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        onReward={handleAdFinished}
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
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loggingInAdmin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {loggingInAdmin ? "Authorizing Security..." : "Authorize & Enter Admin Panel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
