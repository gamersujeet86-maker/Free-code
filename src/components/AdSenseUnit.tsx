import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    aclib?: {
      runBanner?: (config: { zoneId: string }) => void;
    };
  }
}

export default function AdSenseUnit() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.aclib && window.aclib.runBanner) {
      try {
        window.aclib.runBanner({
          zoneId: "11812150",
        });
      } catch (e) {
        console.error("Error executing aclib.runBanner:", e);
      }
    }
  }, []);

  return (
    <div className="my-4 flex justify-center items-center min-h-[90px] w-full overflow-hidden bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
      <div ref={bannerRef} id="adcash-banner-11812150" className="w-full text-center" />
    </div>
  );
}
