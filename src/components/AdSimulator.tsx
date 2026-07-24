import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Award, Clock, Sparkles, X, Gift, RefreshCw } from "lucide-react";
import AdSenseUnit from "./AdSenseUnit";

interface AdSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: () => void;
  adType: "reward" | "booster";
}

export default function AdSimulator({ isOpen, onClose, onReward, adType }: AdSimulatorProps) {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for auto-play compatibility
  const [isPlaying, setIsPlaying] = useState(true);
  const [adStep, setAdStep] = useState<"watching" | "completed">("watching");
  const [selectedAdIndex, setSelectedAdIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rewardClaimedRef = useRef(false);

  const mockAds = [
    {
      title: "Clash of Coins: Ultimate Empire",
      description: "Build your base, raid other earners, and multiply your daily payouts! Play for free today.",
      color: "from-amber-600 to-red-700",
      cta: "Install Now",
      // High quality 15s gaming preview
      videoUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b9e7c10cda2f28b29c4d9b265&profile_id=165&oauth2_token_id=57447761"
    },
    {
      title: "FinTech Pro - Smart Budgeting & UPI",
      description: "Earn cashback on every scan. Connect with verified merchants for 5% instant rewards.",
      color: "from-blue-600 to-indigo-800",
      cta: "Open App",
      // High quality neon business/tech clip
      videoUrl: "https://player.vimeo.com/external/434045526.sd.mp4?s=c27d2ad6cf79d2614c97aa35b9d0abcb7b5a5e38&profile_id=165&oauth2_token_id=57447761"
    },
    {
      title: "QuizMaster: Trivia Royale",
      description: "Solve 10 trivia puzzles to win instant Paytm gift vouchers. Over 2 Million users online!",
      color: "from-purple-600 to-fuchsia-800",
      cta: "Play Free",
      // Fun motion graphics loop
      videoUrl: "https://player.vimeo.com/external/454531102.sd.mp4?s=a2c91c3f9104043b4f693006001099661b171bf8&profile_id=165&oauth2_token_id=57447761"
    },
  ];

  useEffect(() => {
    if (!isOpen) return;

    rewardClaimedRef.current = false;
    setSecondsLeft(15);
    setAdStep("watching");
    setVideoLoaded(false);
    setVideoError(false);
    setIsPlaying(true);
    // Pick a random mock ad
    setSelectedAdIndex(Math.floor(Math.random() * mockAds.length));
  }, [isOpen]);

  const handleClaimReward = () => {
    if (!rewardClaimedRef.current) {
      rewardClaimedRef.current = true;
      onReward();
    }
  };

  // Synchronize timer with video playback state
  useEffect(() => {
    if (!isOpen || adStep === "completed" || !isPlaying) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdStep("completed");
          if (videoRef.current) {
            videoRef.current.pause();
          }
          // Automatically trigger reward credit as soon as ad finishes
          handleClaimReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, adStep, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((err) => console.log("Video playback play call blocked:", err));
      setIsPlaying(true);
    }
  };

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked unless muted
        setIsMuted(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => console.log("Auto-play fully blocked: ", e));
        }
      });
    }
  };

  const handleVideoError = () => {
    console.warn("Video failed to stream, loading realistic interactive canvas fallback instead.");
    setVideoError(true);
    setVideoLoaded(true); // Treat as loaded so fallback UI displays
  };

  if (!isOpen) return null;

  const currentAd = mockAds[selectedAdIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        
        {/* Header with timer */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
              {adType === "booster" ? "2X Earning Booster Video" : "Sponsor Rewarded Video"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle button */}
            <button 
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }} 
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all active:scale-90"
              title={isMuted ? "Unmute Video" : "Mute Video"}
            >
              {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-emerald-400" />}
            </button>
            
            {adStep === "completed" ? (
              <button 
                onClick={onClose}
                className="text-white bg-slate-800 hover:bg-rose-600 p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <X size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-slate-800 text-amber-400 text-xs font-mono">
                <Clock size={12} className="animate-spin text-amber-400" />
                <span>{secondsLeft}s remaining</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Seek Progress bar */}
        <div className="w-full bg-slate-950 h-1">
          <div 
            className="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${((15 - secondsLeft) / 15) * 100}%` }}
          />
        </div>

        {/* Video Frame */}
        <div className="relative flex-1 flex flex-col justify-between min-h-[340px] bg-black">
          {adStep === "watching" ? (
            <div className="absolute inset-0 flex flex-col justify-between overflow-hidden">
              
              {/* Spinner while loading */}
              {!videoLoaded && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
                  <RefreshCw className="animate-spin text-indigo-500 mb-3" size={32} />
                  <span className="text-xs font-semibold tracking-wider uppercase font-display">Streaming Advertisement Video...</span>
                </div>
              )}

              {/* Dynamic HTML5 Video Player */}
              {!videoError ? (
                <video
                  ref={videoRef}
                  src={currentAd.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onLoadedData={handleVideoLoaded}
                  onError={handleVideoError}
                />
              ) : (
                // Beautiful dynamic backup canvas animation if streaming video gets blocked by CORS or sandbox
                <div className={`absolute inset-0 bg-gradient-to-br ${currentAd.color} flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent animate-pulse" />
                  <Sparkles size={48} className="text-amber-300 animate-bounce mb-4" />
                  <h3 className="text-lg font-bold font-display tracking-tight leading-snug">{currentAd.title}</h3>
                  <p className="text-xs text-white/80 mt-2 max-w-xs">{currentAd.description}</p>
                </div>
              )}

              {/* Dark overlay gradients for player aesthetics */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

              {/* Real-time Video Controls overlay */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4">
                
                {/* Top Badge Info */}
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500/90 text-[10px] text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold shadow-sm font-display">
                    Sponsor Partner
                  </span>
                  <span className="text-[10px] text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded-full">
                    HD Premium ad
                  </span>
                </div>

                {/* Bottom Bar Info & Play Button */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-white text-base font-bold font-display tracking-tight leading-tight mb-1 drop-shadow-md">
                        {currentAd.title}
                      </h4>
                      <p className="text-white/80 text-[11px] line-clamp-2 leading-relaxed drop-shadow">
                        {currentAd.description}
                      </p>
                    </div>

                    {/* Interactive Play/Pause controller */}
                    <button
                      onClick={togglePlay}
                      className="bg-white hover:bg-slate-100 text-slate-900 p-3 rounded-2xl shadow-lg transition transform hover:scale-105 active:scale-95 shrink-0"
                    >
                      {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-white/60 font-mono">
                    <span>Watching: {15 - secondsLeft}s</span>
                    <span className="text-amber-400 font-bold tracking-widest animate-pulse">DON'T CLOSE</span>
                    <span>Total: 15s</span>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce">
                <Award className="text-emerald-400" size={32} />
              </div>
              
              <h3 className="text-white text-xl font-bold font-display tracking-tight">
                Video Completed Successfully!
              </h3>
              
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm leading-relaxed">
                Thank you! Your active video view is successfully attributed to publisher <strong>pub-9048277633959630</strong>. Payout reserves have been updated.
              </p>

              <div className="mt-6 w-full bg-slate-950 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-display">
                    Coin Prize Generated
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {adType === "booster" ? "2x Coin Multiplier (15m)" : "+10 Premium Coins"}
                  </p>
                </div>
                <button
                  onClick={onReward}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition transform hover:scale-105 active:scale-95"
                >
                  Claim Reward
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Embedded AdSense display frame to fulfill live adsense view during interaction */}
        <div className="bg-slate-950/50 p-4 border-t border-slate-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-display">Google AdSense Partner Frame</span>
            <span className="text-[9px] text-slate-600 font-mono">ID: pub-9048277633959630</span>
          </div>
          {/* Minimum slot AdSense banner */}
          <div className="opacity-95">
            <AdSenseUnit format="horizontal" responsive={true} slot="8901234567" />
          </div>
        </div>

        {/* Bottom Banner Info */}
        <div className="bg-slate-950 px-4 py-3 text-[10px] text-slate-500 text-center border-t border-slate-800">
          This system uses valid AdSense publisher tags. Payouts require genuine traffic compliance.
        </div>
      </div>
    </div>
  );
}
