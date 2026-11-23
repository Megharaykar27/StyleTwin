// Hero animation: a stylised figure whose outfit changes every few
// seconds, with a "scanning" light sweeping over it like the AI at work.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LOOKS = [
  { name: "Lilac slip dress", top: "#C4B5FD", bottom: "#C4B5FD", dress: true, accent: "#F9A8D4" },
  { name: "Denim + white tee", top: "#F5F5F4", bottom: "#4A6A95", accent: "#93C5FD" },
  { name: "Emerald co-ord", top: "#10B981", bottom: "#047857", accent: "#6EE7B7" },
  { name: "Rose saree drape", top: "#EC4899", bottom: "#BE185D", dress: true, accent: "#FDE68A" },
  { name: "Black blazer suit", top: "#18181B", bottom: "#27272A", accent: "#A78BFA" },
];

export default function Mannequin() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LOOKS.length), 2600);
    return () => clearInterval(t);
  }, []);
  const look = LOOKS[i];

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
      <div className="glass absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.35),transparent_60%)]" />
        <svg viewBox="0 0 300 400" className="relative h-full w-full">
          <defs>
            <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#E8B796" />
              <stop offset="1" stopColor="#C98F6B" />
            </linearGradient>
          </defs>
          {/* head + hair */}
          <ellipse cx="150" cy="72" rx="30" ry="36" fill="url(#skin)" />
          <path d="M118 70 Q120 28 150 30 Q182 28 184 70 Q186 120 196 150 L176 150 Q172 100 170 78 Q150 92 130 78 Q128 100 124 150 L104 150 Q114 120 118 70Z" fill="#2A1712" />
          <rect x="140" y="104" width="20" height="18" fill="url(#skin)" />
          {/* arms */}
          <path d="M98 140 Q80 200 86 262" stroke="url(#skin)" strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M202 140 Q220 200 214 262" stroke="url(#skin)" strokeWidth="16" strokeLinecap="round" fill="none" />
          {/* legs */}
          <rect x="124" y="270" width="22" height="110" rx="10" fill="url(#skin)" />
          <rect x="154" y="270" width="22" height="110" rx="10" fill="url(#skin)" />
          {/* outfit, animated between looks */}
          <motion.path
            animate={{ fill: look.top }}
            transition={{ duration: 0.8 }}
            d={look.dress ? "M106 124 Q150 112 194 124 L206 170 L194 182 L200 330 Q150 344 100 330 L106 182 L94 170Z" : "M106 124 Q150 112 194 124 L208 172 L194 182 L192 262 L108 262 L106 182 L92 172Z"}
          />
          {!look.dress && (
            <motion.path animate={{ fill: look.bottom }} transition={{ duration: 0.8 }} d="M108 258 L192 258 L190 372 L156 372 L150 290 L144 372 L110 372Z" />
          )}
          <motion.circle animate={{ fill: look.accent }} cx="150" cy="140" r="5" />
          <ellipse cx="135" cy="386" rx="16" ry="6" fill="#111" opacity="0.6" />
          <ellipse cx="165" cy="386" rx="16" ry="6" fill="#111" opacity="0.6" />
        </svg>
        {/* scanning light */}
        <motion.div
          key={i}
          initial={{ top: "-10%", opacity: 0 }}
          animate={{ top: "105%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-aura-cyan/40 to-transparent"
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={look.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-strong absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm"
        >
          <span className="h-3 w-3 rounded-full" style={{ background: look.top }} />
          {look.name}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
