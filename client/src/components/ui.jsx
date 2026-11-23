import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export const Spinner = ({ className = "" }) => <span className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />;

export const PageTitle = ({ kicker, title, sub, children }) => (
  <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div>
      {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-aura-pink">{kicker}</p>}
      <h1 className="text-4xl font-extrabold md:text-5xl">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-white/55">{sub}</p>}
    </div>
    {children}
  </div>
);

export const Empty = ({ icon: Icon, title, text, children }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mx-auto max-w-md p-10 text-center">
    {Icon && (
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aura-violet/40 to-aura-pink/40">
        <Icon size={26} />
      </span>
    )}
    <p className="mt-5 font-display text-xl font-bold">{title}</p>
    <p className="mt-2 text-sm text-white/55">{text}</p>
    {children && <div className="mt-6">{children}</div>}
  </motion.div>
);

// Card that tilts in 3D toward the mouse
export function TiltCard({ children, className = "", ...rest }) {
  const ref = useRef(null);
  const x = useMotionValue(0.5), y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5); }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Circular score (0–100) that fills up on mount
export function ScoreRing({ value, size = 64 }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="5" fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ring)" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold">{value}</span>
    </div>
  );
}

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
export const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } };
