import React, { useState, useEffect, useRef } from "react";
import { Clock, Sparkles, X, CheckCircle2, ArrowDown, ChevronDown, Award, ShieldCheck, ExternalLink } from "lucide-react";

interface AdSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: () => void;
  adType: "reward" | "booster";
}

const DIRECT_LINK_URL = "https://omg10.com/4/11383535";

export default function AdSimulator({ isOpen, onClose, onReward, adType }: AdSimulatorProps) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSecondsLeft(10);
    setHasScrolledToBottom(false);
    setRewardClaimed(false);

    // Reset scroll position
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // 10-second countdown timer
  useEffect(() => {
    if (!isOpen || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsLeft]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Check if user has scrolled near the bottom (within 30px)
    if (scrollHeight - scrollTop - clientHeight < 30) {
      setHasScrolledToBottom(true);
    }
  };

  const handleScrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setHasScrolledToBottom(true);
    }
  };

  const handleClaimReward = () => {
    if (secondsLeft > 0 || !hasScrolledToBottom || rewardClaimed) return;
    setRewardClaimed(true);
    onReward();
  };

  if (!isOpen) return null;

  const canContinue = secondsLeft === 0 && hasScrolledToBottom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400">
              <Sparkles size={18} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide font-display">
                {adType === "booster" ? "2x Coin Multiplier Task" : "Earn 10 Coins Task"}
              </h3>
              <p className="text-[11px] text-slate-300">
                Complete 10s wait & scroll to continue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Timer & Status Bar */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-indigo-950">
            <Clock size={16} className={secondsLeft > 0 ? "text-indigo-600 animate-pulse" : "text-emerald-600"} />
            <span>
              {secondsLeft > 0 ? (
                <>Timer: <strong className="text-indigo-600 text-sm">{secondsLeft}s</strong> remaining</>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={14} className="text-emerald-600" /> 10s Timer Completed!
                </span>
              )}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            {hasScrolledToBottom ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Scrolled to bottom
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1 animate-pulse">
                <ArrowDown size={13} /> Scroll down required
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="p-6 overflow-y-auto space-y-4 max-h-[360px] text-slate-700 text-xs leading-relaxed font-sans bg-slate-50/50"
        >
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <ShieldCheck size={18} />
              <span>Verified Coin Earning Protocol</span>
            </div>
            <p className="text-slate-600">
              Welcome to the Fast Earn task zone. You are just a few seconds away from receiving your <strong>10 reward coins</strong> directly into your balance!
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              📌 Simple Rules for Claiming Rewards
            </h4>
            <ul className="space-y-2 text-slate-600 list-disc list-inside">
              <li>Wait for the <strong>10-second timer</strong> above to reach 0.</li>
              <li>Scroll down to the bottom of this text container.</li>
              <li>Click the green <strong>"Continue & Claim Coins"</strong> button below.</li>
              <li>Your coins will be instantly credited and updated in your balance!</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 p-4 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md uppercase tracking-wide">
                Special Sponsor
              </span>
              <a
                href={DIRECT_LINK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline"
              >
                <span>Visit Partner Link</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-slate-700 font-medium">
              Click the partner offer link above to check out special bonus deals from our verified sponsor!
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              🎁 Redemption & Gift Code Info
            </h4>
            <p className="text-slate-600">
              Accumulate coins to unlock ₹10, ₹20, ₹50, and ₹100 Google Play gift codes, Paytm Cash, and UPI transfers. Submit your phone number or UPI ID in the Withdrawal tab for manual payout verification!
            </p>
          </div>

          {/* Bottom marker for scrolling */}
          <div className="pt-4 border-t border-slate-200 text-center text-slate-400 font-medium text-[11px]">
            --- You have reached the bottom! ---
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {!hasScrolledToBottom && (
            <button
              onClick={handleScrollToBottom}
              className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-bold py-1.5 flex items-center justify-center gap-1 transition"
            >
              <span>Jump / Scroll to bottom</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          )}

          <button
            onClick={handleClaimReward}
            disabled={!canContinue || rewardClaimed}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
              canContinue
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95 cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {canContinue ? (
              <>
                <Award size={18} />
                <span>Continue & Claim {adType === "booster" ? "2x Booster Multiplier" : "10 Coins"}</span>
              </>
            ) : secondsLeft > 0 ? (
              <>
                <Clock size={16} className="animate-spin" />
                <span>Please wait {secondsLeft}s...</span>
              </>
            ) : (
              <>
                <ArrowDown size={16} className="animate-bounce" />
                <span>Scroll down to bottom to Continue</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
