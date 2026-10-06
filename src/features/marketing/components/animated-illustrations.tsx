"use client";

// CSS defined as module-level constants — avoids nested template-literal syntax errors in JSX
const TRUCK_CSS =
  "@keyframes truck-drive{0%{transform:translateX(110%)}100%{transform:translateX(-130%)}}" +
  "@keyframes wheel-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}" +
  "@keyframes smoke-puff{0%,100%{opacity:0;transform:translateY(0) scale(.8)}50%{opacity:.5;transform:translateY(-8px) scale(1.2)}}";

const PAWS_CSS =
  "@keyframes float-up{0%{opacity:0;transform:translateY(0)}20%{opacity:.5}80%{opacity:.3}100%{opacity:0;transform:translateY(-64px)}}";

const CHECK_CSS =
  "@keyframes draw-circle{0%{stroke-dashoffset:100}100%{stroke-dashoffset:0}}" +
  "@keyframes draw-check{0%{stroke-dashoffset:50}100%{stroke-dashoffset:0}}";

const PAW_PATH =
  "M12 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" +
  "m-5.5 3c-1.4 0-2.5 1.1-2.5 2.5S5.1 10 6.5 10 9 8.9 9 7.5 7.9 5 6.5 5z" +
  "m11 0c-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5S18.9 5 17.5 5z" +
  "m-11 7c-2 0-3.6 1.6-3.6 3.6 0 2 2.1 4.4 5.6 7.4 1.1-.8 4.2-3.2 5.5-5 1.3 1.8 4.4 4.2 5.5 5" +
  " 3.5-3 5.6-5.4 5.6-7.4 0-2-1.6-3.6-3.6-3.6-1.5 0-2.8 1-3.3 2.3-.4-.5-1.1-.9-1.9-.9" +
  "s-1.5.4-1.9.9c-.5-1.3-1.8-2.3-3.3-2.3z";

const PAWS_POSITIONS = [
  { left: "8%", delay: "0s" },
  { left: "24%", delay: "1.4s" },
  { left: "47%", delay: "2.9s" },
  { left: "68%", delay: "4.3s" },
  { left: "86%", delay: "5.7s" },
];

// ─── Delivery Truck ──────────────────────────────────────────────────────────
export function DeliveryTruckAnimation() {
  return (
    <div aria-hidden="true" className="relative h-36 w-full overflow-hidden rounded-2xl bg-slate-800">
      <style dangerouslySetInnerHTML={{ __html: TRUCK_CSS }} />

      {/* Road */}
      <div className="absolute bottom-0 h-10 w-full bg-slate-700" />
      {/* Dashed centre line */}
      <div
        className="absolute bottom-3.5 h-1 w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg,#f59e0b 0,#f59e0b 24px,transparent 24px,transparent 48px)",
        }}
      />

      {/* Truck group */}
      <div
        className="absolute bottom-10"
        style={{ animation: "truck-drive 10s linear infinite" }}
      >
        <svg viewBox="0 0 130 55" className="h-20" xmlns="http://www.w3.org/2000/svg">
          {/* Cargo body */}
          <rect x="5" y="8" width="80" height="34" rx="4" fill="#f59e0b" />
          {/* Paw mark on cargo side */}
          <text x="28" y="31" fontSize="16" opacity="0.5">
            &#128062;
          </text>
          {/* Cab */}
          <rect x="82" y="4" width="36" height="38" rx="5" fill="#b45309" />
          {/* Windshield */}
          <rect x="86" y="10" width="22" height="14" rx="2" fill="#bae6fd" opacity="0.8" />
          {/* Exhaust smoke */}
          <circle cx="4" cy="12" r="4" fill="#94a3b8" style={{ animation: "smoke-puff 1.5s ease-in-out infinite" }} />
          <circle cx="4" cy="5" r="3" fill="#94a3b8" style={{ animation: "smoke-puff 1.5s ease-in-out infinite", animationDelay: "0.4s" }} />

          {/* Front wheel */}
          <g style={{ transformOrigin: "100px 47px", animation: "wheel-spin 0.9s linear infinite" }}>
            <circle cx="100" cy="47" r="9" fill="#1e293b" />
            <circle cx="100" cy="47" r="3.5" fill="#64748b" />
            <line x1="100" y1="38" x2="100" y2="56" stroke="#475569" strokeWidth="1.5" />
            <line x1="91" y1="47" x2="109" y2="47" stroke="#475569" strokeWidth="1.5" />
          </g>
          {/* Rear wheel */}
          <g style={{ transformOrigin: "28px 47px", animation: "wheel-spin 0.9s linear infinite" }}>
            <circle cx="28" cy="47" r="9" fill="#1e293b" />
            <circle cx="28" cy="47" r="3.5" fill="#64748b" />
            <line x1="28" y1="38" x2="28" y2="56" stroke="#475569" strokeWidth="1.5" />
            <line x1="19" y1="47" x2="37" y2="47" stroke="#475569" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─── Pulsing Location Pin ────────────────────────────────────────────────────
export function PulsingLocationPin({ className }: { className?: string }) {
  return (
    <div
      className={"relative flex h-10 w-10 items-center justify-center " + (className ?? "")}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-25" />
      <span
        className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-amber-400 opacity-20"
        style={{ animationDelay: "0.3s" }}
      />
      <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500 shadow-lg" />
    </div>
  );
}

// ─── Floating Paw Prints ─────────────────────────────────────────────────────
export function FloatingPawPrints() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: PAWS_CSS }} />
      {PAWS_POSITIONS.map((pos, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute bottom-0 h-8 w-8 text-amber-500/10"
          style={{
            left: pos.left,
            animation: "float-up 6s ease-in infinite",
            animationDelay: pos.delay,
          }}
        >
          <path d={PAW_PATH} />
        </svg>
      ))}
    </div>
  );
}

// ─── Shipment Created Success Animation ─────────────────────────────────────
export function ShipmentCreatedAnimation() {
  return (
    <div className="relative h-16 w-16">
      <style dangerouslySetInnerHTML={{ __html: CHECK_CSS }} />
      <svg viewBox="0 0 50 50" className="h-16 w-16">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeDasharray="100"
          strokeDashoffset="100"
          style={{ animation: "draw-circle 0.8s ease forwards" }}
        />
        <polyline
          points="15,25 22,32 35,18"
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="50"
          strokeDashoffset="50"
          style={{ animation: "draw-check 0.5s ease 0.8s forwards" }}
        />
      </svg>
    </div>
  );
}

// ─── Live Radar Ping ─────────────────────────────────────────────────────────
export function LiveRadarPing({ className }: { className?: string }) {
  return (
    <div
      className={
        "relative flex h-8 w-8 shrink-0 items-center justify-center " + (className ?? "")
      }
    >
      <svg
        viewBox="0 0 32 32"
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static center dot */}
        <circle cx="16" cy="16" r="4" fill="#f59e0b" />
        {/* Ring 1 */}
        <circle cx="16" cy="16" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5">
          <animate attributeName="r" values="4;16" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
        </circle>
        {/* Ring 2 — staggered */}
        <circle cx="16" cy="16" r="4" fill="none" stroke="#f59e0b" strokeWidth="1.5">
          <animate attributeName="r" values="4;16" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
