import React, { useEffect, useState } from "react";

interface AdSenseUnitProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
}

export default function AdSenseUnit({
  slot = "1234567890",
  format = "auto",
  responsive = true,
}: AdSenseUnitProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Initialize existing adsbygoogle script
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense script load warning (common in sandbox or adblock environments):", e);
      setHasError(true);
    }
  }, []);

  return (
    <div className="w-full my-4 mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase font-display">
          Sponsored Advertisement
        </span>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
          AdSense: pub-9048277633959630
        </span>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[120px] bg-slate-50 rounded-lg p-4 border border-dashed border-slate-200">
        {/* Real Google AdSense Unit */}
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%" }}
          data-ad-client="ca-pub-9048277633959630"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />

        {/* Fallback & Visual Placeholder if script is blocked or in sandbox */}
        <div className="flex flex-col items-center text-center max-w-md pointer-events-none mt-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2 text-indigo-600">
            <svg
              className="w-5 h-5 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Google AdSense Live Unit</p>
          <p className="text-xs text-slate-400 mt-1">
            Displaying high-paying ads from advertiser networks. Watching or clicking support-linked banners funds user payouts!
          </p>
        </div>
      </div>
    </div>
  );
}
