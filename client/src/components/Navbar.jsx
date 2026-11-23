import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, LogOut, Shirt, Sparkles, Palette, Wand2 } from "lucide-react";
import { useApp } from "../lib/app";

export const APP_LINKS = [
  { to: "/studio", label: "Studio", icon: Wand2 },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/outfits", label: "Outfits", icon: Sparkles },
  { to: "/style", label: "My Style", icon: Palette },
  { to: "/lookbook", label: "Lookbook", icon: BookHeart },
];

export const Logo = () => (
  <span className="flex items-center gap-2 font-display text-base font-extrabold sm:text-xl">
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-aura-violet to-aura-pink">
      <Shirt size={16} />
    </span>
    Style<span className="gradient-text">Twin</span>
  </span>
);

export default function Navbar() {
  const { user, logout, aiMode } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <motion.header initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed inset-x-0 top-4 z-40 px-4">
        <nav className="glass-strong mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-3 pl-5">
          <Link to={user ? "/studio" : "/"}><Logo /></Link>

          {user && (
            <div className="hidden items-center gap-1 md:flex">
              {APP_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} className="relative rounded-full px-4 py-2 text-sm font-medium">
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                      <span className={`relative ${isActive ? "text-white" : "text-white/60 hover:text-white"}`}>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {aiMode === "demo" && (
              <span title="No Gemini key: free try-on for tops, other features run in demo mode" className="hidden rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold text-amber-200 sm:inline">
                Free mode
              </span>
            )}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="grid h-10 w-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Log out"
                title={`Log out ${user.name}`}
              >
                <LogOut size={18} />
              </button>
            ) : (
              <>
                <Link to="/login" className="hidden px-3 text-sm font-medium text-white/70 hover:text-white sm:block">Log in</Link>
                <Link to="/register" className="btn-primary whitespace-nowrap px-3.5 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-base">Get started</Link>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="glass-strong fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full px-2 py-2 md:hidden">
          {APP_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] ${isActive ? "bg-white/10 text-white" : "text-white/55"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
