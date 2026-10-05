"use client";

import React from "react";

export function DeliveryTruckAnimation() {
  return (
    <div className="relative h-40 w-full overflow-hidden" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes truck-drive { 0% { transform: translateX(110%); } 100% { transform: translateX(-110%); } }
        @keyframes wheel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes exhaust { 0%,100% { opacity: 0; transform: translateY(0) scale(0.8); } 50% { opacity: 0.6; transform: translateY(-8px) scale(1.2); } }
      `}} />
      <svg
        viewBox="0 0 400 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 h-full w-auto"
        style={{ animation: "truck-drive 12s linear infinite" }}
      >
        <path d="M50 110 L50 40 C50 30, 60 20, 70 20 L220 20 L220 110 Z" fill="#F59E0B" />
        <path d="M220 110 L220 50 L280 50 C290 50, 300 60, 310 70 L340 110 Z" fill="#D97706" />
        <rect x="230" y="60" width="40" height="30" rx="5" fill="#1E293B" />
        <circle cx="100" cy="110" r="20" fill="#0F172A" />
        <circle cx="100" cy="110" r="10" fill="#CBD5E1" style={{ transformOrigin: "100px 110px", animation: "wheel-spin 1s linear infinite" }} />
        <circle cx="280" cy="110" r="20" fill="#0F172A" />
        <circle cx="280" cy="110" r="10" fill="#CBD5E1" style={{ transformOrigin: "280px 110px", animation: "wheel-spin 1s linear infinite" }} />
      </svg>
    </div>
  );
}

export function PulsingLocationPin({ className }: { className?: string }) {
  return (
    <div className={`relative h-12 w-12 flex items-center justify-center ${className || ""}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ping-ring { 0% { r: 4px; opacity: 0.8; } 100% { r: 20px; opacity: 0; } }
      `}} />
      <svg viewBox="0 0 48 48" className="absolute h-full w-full overflow-visible">
        <circle cx="24" cy="24" fill="#F59E0B" style={{ animation: "ping-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
        <circle cx="24" cy="24" r="6" fill="#F59E0B" />
      </svg>
    </div>
  );
}

export function FloatingPawPrints() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up { 0% { transform: translateY(100px) scale(0.8); opacity: 0; } 20% { opacity: 0.4; } 80% { opacity: 0.4; } 100% { transform: translateY(-100vh) scale(1.2); opacity: 0; } }
      `}} />
      {[
        { left: "10%", delay: "0s" },
        { left: "30%", delay: "1.5s" },
        { left: "50%", delay: "3s" },
        { left: "70%", delay: "4.5s" },
        { left: "90%", delay: "6s" },
      ].map((pos, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute bottom-0 h-8 w-8 text-amber-500/10"
          style={{
            left: pos.left,
            animation: \`float-up 6s ease-in infinite\`,
            animationDelay: pos.delay
          }}
        >
          <path d="M12 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3zm-5.5 3c-1.4 0-2.5 1.1-2.5 2.5S5.1 10 6.5 10 9 8.9 9 7.5 7.9 5 6.5 5zm11 0c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5S18.9 5 17.5 5zm-11 7c-2 0-3.6 1.6-3.6 3.6 0 2 2.1 4.4 5.6 7.4 1.1-.8 4.2-3.2 5.5-5 1.3 1.8 4.4 4.2 5.5 5 3.5-3 5.6-5.4 5.6-7.4 0-2-1.6-3.6-3.6-3.6-1.5 0-2.8 1-3.3 2.3-.4-.5-1.1-.9-1.9-.9s-1.5.4-1.9.9c-.5-1.3-1.8-2.3-3.3-2.3z" />
        </svg>
      ))}
    </div>
  );
}

export function ShipmentCreatedAnimation() {
  return (
    <div className="relative h-16 w-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes draw-circle { 0% { stroke-dashoffset: 100; } 100% { stroke-dashoffset: 0; } }
        @keyframes draw-check { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
      `}} />
      <svg viewBox="0 0 40 40" className="h-full w-full text-green-500">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100" style={{ animation: "draw-circle 1s ease-out forwards" }} />
        <path d="M12 20 l6 6 l12 -12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50" style={{ strokeDashoffset: 50, animation: "draw-check 0.5s ease-out 1s forwards" }} />
      </svg>
    </div>
  );
}

export function LiveRadarPing({ className }: { className?: string }) {
  return (
    <div className={`relative h-8 w-8 flex items-center justify-center ${className || ""}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-ping { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
      `}} />
      <div className="absolute h-full w-full rounded-full border-2 border-amber-500" style={{ animation: "radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
      <div className="absolute h-full w-full rounded-full border-2 border-amber-500" style={{ animation: "radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite", animationDelay: "1s" }} />
      <div className="h-2 w-2 rounded-full bg-amber-500" />
    </div>
  );
}
