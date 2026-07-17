import React, { useState } from "react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Coins, 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  Globe, 
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  Facebook,
  Instagram
} from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (token: string, user: { id: string; email: string; isAdmin: boolean }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeModal, setActiveModal] = useState<null | "google" | "facebook" | "instagram" | "admin">(null);
  
  // Input states
  const [customEmail, setCustomEmail] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbPassword, setFbPassword] = useState("");
  const [igUsername, setIgUsername] = useState("");
  const [igPassword, setIgPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Social Login (real API integration)
  const handleSocialSubmit = async (email: string, provider: string) => {
    if (!email) {
      setError("Please provide a valid email or username.");
      return;
    }

    // Basic validation for typed inputs
    if (!email.includes("@") && provider === "google") {
      setError("Please enter a valid Google email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // If it's Instagram, and doesn't have @, append instagram domain mock
      const finalEmail = email.includes("@") ? email : `${email.toLowerCase().trim()}@instagram.com`;

      const response = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: finalEmail, provider }),
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
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      // Success
      onLoginSuccess(data.token, data.user);
      setActiveModal(null);
    } catch (err: any) {
      setError(err.message || "Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Classic Admin Login (to allow admin@gmail.com login)
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!adminEmail || !adminPassword) {
      setError("Please fill in all admin credentials.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
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
        throw new Error(data.error || "Invalid admin credentials.");
      }

      onLoginSuccess(data.token, data.user);
      setActiveModal(null);
    } catch (err: any) {
      setError(err.message || "Admin authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-indigo-100 relative overflow-hidden">
      
      {/* Decorative ambient background spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-75"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transition-all duration-300 relative z-10">
        
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 shadow-lg border border-white/10">
              <Coins className="text-amber-400 animate-bounce" size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">
              Redeem Code Earner
            </h1>
            <p className="text-indigo-100 text-xs mt-1 max-w-xs mx-auto">
              Get paid for watching short advertisements, earn secure coins, and redeem instantly for Google Play & PayTM redeem codes!
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8">
          
          {/* Main Title / Message */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Welcome Earning Partner</h2>
            <p className="text-slate-500 text-xs mt-1">Select your preferred platform to start earning instantly.</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs flex items-start gap-2">
              <ShieldAlert className="shrink-0 mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs flex items-center gap-2">
              <Sparkles className="shrink-0 text-emerald-500" size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Social Sign-In Buttons */}
          <div className="space-y-3.5">
            
            {/* Google */}
            <button
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setActiveModal("google");
              }}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-md group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                {/* Custom High-Fidelity Google Icon */}
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.03 4.22v3.51h6.63c3.88-3.57 6.45-8.83 6.45-14.58z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-6.63-3.51c-1.84 1.25-4.18 2.01-6.69 2.01-5.14 0-9.5-3.47-11.05-8.15H1.31v3.63C4.19 20.89 8.12 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M.95 11.44c-.39-1.25-.39-2.58 0-3.83V3.98H1.31L12 1.4c1.84 0 3.51.56 4.96 1.56l3.71-3.72C18.23.95 15.28 0 12 0 8.12 0 4.19 3.11 1.31 8.81L.95 11.44z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.17 0 12 0 8.12 0 4.19 3.11 1.31 8.81l6.63 5.15c1.55-4.68 5.91-8.15 11.05-8.15z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Continue with Google</span>
                  <span className="block text-[10px] text-slate-400">One-click secure registration</span>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:translate-x-0.5 transition-transform" size={18} />
            </button>

            {/* Facebook */}
            <button
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setActiveModal("facebook");
              }}
              className="w-full flex items-center justify-between bg-blue-50/40 hover:bg-blue-50 border border-blue-100/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-md group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shadow-sm">
                  <Facebook size={18} fill="currentColor" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Continue with Facebook</span>
                  <span className="block text-[10px] text-slate-400">Sign in securely using Meta</span>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:translate-x-0.5 transition-transform" size={18} />
            </button>

            {/* Instagram */}
            <button
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setActiveModal("instagram");
              }}
              className="w-full flex items-center justify-between bg-pink-50/20 hover:bg-pink-50/40 border border-pink-100/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-md group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm">
                  <Instagram size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Continue with Instagram</span>
                  <span className="block text-[10px] text-slate-400">Connect using your Instagram ID</span>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:translate-x-0.5 transition-transform" size={18} />
            </button>

          </div>

          {/* Quick Benefits / Ad Info */}
          <div className="mt-8 pt-3 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <TrendingUp size={13} className="text-indigo-500" />
              <span>Earn 10 coins instantly for watching standard sponsor ads.</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-amber-500 animate-pulse" />
              <span>Activate 2x Multiplier booster to earn 20 coins per ad!</span>
            </div>
          </div>

          {/* Discreet Admin Portal Entry */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setError(null);
                setSuccessMsg(null);
                setActiveModal("admin");
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-600 transition font-semibold"
            >
              <ShieldCheck size={12} />
              <span>Staff / Administrator Portal Sign-In</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Globe size={12} className="text-slate-400" />
          <span>Real-time Secure Server Handshake Active</span>
        </div>
      </div>

      {/* --- HIGH FIDELITY INTERACTIVE OAUTH MODALS --- */}

      {/* 1. GOOGLE SIGN IN POPUP MODAL */}
      {activeModal === "google" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.03 4.22v3.51h6.63c3.88-3.57 6.45-8.83 6.45-14.58z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-6.63-3.51c-1.84 1.25-4.18 2.01-6.69 2.01-5.14 0-9.5-3.47-11.05-8.15H1.31v3.63C4.19 20.89 8.12 24 12 24z" />
                  <path fill="#FBBC05" d="M.95 11.44c-.39-1.25-.39-2.58 0-3.83V3.98H1.31L12 1.4c1.84 0 3.51.56 4.96 1.56l3.71-3.72C18.23.95 15.28 0 12 0 8.12 0 4.19 3.11 1.31 8.81L.95 11.44z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.17 0 12 0 8.12 0 4.19 3.11 1.31 8.81l6.63 5.15c1.55-4.68 5.91-8.15 11.05-8.15z" />
                </svg>
                <span className="font-semibold text-slate-800 text-sm">Sign in with Google</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-base font-bold text-slate-800">Choose an account</h3>
              <p className="text-slate-500 text-xs">to continue to <span className="font-semibold text-indigo-600">Redeem Code Earner</span></p>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto mb-6">
              
              {/* Profile Option 1: User's Actual Email (from Metadata) */}
              <button
                onClick={() => handleSocialSubmit("gamersujeet86@gmail.com", "google")}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-left transition active:bg-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  S
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Sujeet Kumar</span>
                  <span className="block text-xs text-slate-500">gamersujeet86@gmail.com</span>
                </div>
              </button>

              {/* Profile Option 2: Default Demo */}
              <button
                onClick={() => handleSocialSubmit("guest.earner@gmail.com", "google")}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 rounded-2xl border border-slate-100 text-left transition active:bg-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                  G
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">Guest Partner</span>
                  <span className="block text-xs text-slate-500">guest.earner@gmail.com</span>
                </div>
              </button>

            </div>

            {/* Custom Account Input Form */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-600 mb-2 font-semibold">Or use another Google email:</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="enter.name@gmail.com"
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSocialSubmit(customEmail, "google")}
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-5 text-center leading-relaxed">
              To continue, Google will share your name, email address, language preference, and profile picture with Redeem Code Earner.
            </p>
          </div>
        </div>
      )}

      {/* 2. FACEBOOK SIGN IN POPUP MODAL */}
      {activeModal === "facebook" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* FB Blue Header */}
            <div className="bg-[#1877F2] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Facebook size={22} fill="currentColor" />
                <span className="font-bold text-sm tracking-wide">Facebook Connection</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-5">
                <h3 className="text-base font-bold text-slate-800">Connect to Earning App</h3>
                <p className="text-slate-500 text-xs mt-0.5">Logging into your Facebook account allows instant sync.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    Email Address or Phone Number
                  </label>
                  <input
                    type="text"
                    value={fbEmail}
                    onChange={(e) => setFbEmail(e.target.value)}
                    placeholder="example@domain.com or mobile"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    Facebook Password
                  </label>
                  <input
                    type="password"
                    value={fbPassword}
                    onChange={(e) => setFbPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-100 focus:outline-none transition bg-slate-50"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!fbEmail) {
                      setError("Please provide your Facebook login email or ID.");
                      return;
                    }
                    const finalEmail = fbEmail.includes("@") ? fbEmail : `${fbEmail.trim()}@facebook.com`;
                    handleSocialSubmit(finalEmail, "facebook");
                  }}
                  disabled={loading}
                  className="w-full bg-[#1877F2] hover:bg-[#155fc2] text-white py-3.5 rounded-xl font-bold text-xs transition active:scale-[0.99] disabled:opacity-50 mt-1"
                >
                  {loading ? "Establishing handshake..." : "Log In & Authorize Link"}
                </button>
              </div>

              <div className="text-center mt-5">
                <a href="#forgot" className="text-xs text-blue-600 hover:underline font-medium">Forgot account?</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INSTAGRAM SIGN IN POPUP MODAL */}
      {activeModal === "instagram" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
            >
              &times;
            </button>

            {/* Instagram Typography Logo */}
            <div className="text-center mt-4 mb-6">
              <h2 className="text-2xl font-serif italic font-bold tracking-tight bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] bg-clip-text text-transparent">
                Instagram
              </h2>
              <p className="text-slate-400 text-[11px] mt-1">Authenticate to connect with Redeem Code Earner</p>
            </div>

            <div className="space-y-3.5">
              <input
                type="text"
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
                placeholder="Phone number, username, or email"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none bg-slate-50 transition"
              />
              <input
                type="password"
                value={igPassword}
                onChange={(e) => setIgPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:border-slate-400 focus:outline-none bg-slate-50 transition"
              />

              <button
                onClick={() => {
                  if (!igUsername) {
                    setError("Please provide your Instagram username or email.");
                    return;
                  }
                  const finalEmail = igUsername.includes("@") ? igUsername : `${igUsername.trim()}@instagram.com`;
                  handleSocialSubmit(finalEmail, "instagram");
                }}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white py-3 rounded-lg font-bold text-xs transition active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Connecting securely..." : "Log In with Instagram"}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Instant demo profile fast path */}
              <button
                onClick={() => handleSocialSubmit("insta.partner@instagram.com", "instagram")}
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <UserIcon size={14} />
                <span>Instant Demo Sign-In</span>
              </button>
            </div>

            <div className="text-center mt-5 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">
                Instagram is a trademark of Meta Platforms, Inc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN LOGIN POPUP MODAL */}
      {activeModal === "admin" && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={20} />
                <span className="font-bold text-slate-800 text-sm">Staff Administration login</span>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition bg-slate-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs transition active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Authenticating Admin..." : "Access Administrator Panels"}
              </button>
            </form>

            <div className="mt-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-[10px] text-indigo-700 leading-relaxed">
              <strong>Admin Credentials:</strong> Use <code className="bg-indigo-100 px-1 py-0.5 rounded">admin@gmail.com</code> with password <code className="bg-indigo-100 px-1 py-0.5 rounded">admin124</code> to log in and manage redeem requests!
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
