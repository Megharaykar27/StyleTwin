import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import Aurora from "./components/Aurora";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { useApp } from "./lib/app";

const Studio = lazy(() => import("./pages/Studio"));
const Wardrobe = lazy(() => import("./pages/Wardrobe"));
const Outfits = lazy(() => import("./pages/Outfits"));
const Style = lazy(() => import("./pages/Style"));
const Lookbook = lazy(() => import("./pages/Lookbook"));
const Auth = lazy(() => import("./pages/Auth"));

function Private({ children }) {
  const { user } = useApp();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}

const Page = ({ children }) => (
  <motion.main
    initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-28 md:px-6 md:pb-16"
  >
    {children}
  </motion.main>
);

export default function App() {
  const location = useLocation();
  const { user } = useApp();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const p = (el) => <Page>{el}</Page>;
  const priv = (el) => p(<Private>{el}</Private>);

  return (
    <>
      <Aurora />
      <Toaster position="bottom-center" toastOptions={{ style: { background: "rgba(26,16,48,0.92)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, backdropFilter: "blur(12px)", fontSize: 14 } }} />
      <Navbar />
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-white/40">Loading…</div>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={user ? <Navigate to="/studio" replace /> : p(<Home />)} />
            <Route path="/login" element={p(<Auth mode="login" />)} />
            <Route path="/register" element={p(<Auth mode="register" />)} />
            <Route path="/studio" element={priv(<Studio />)} />
            <Route path="/wardrobe" element={priv(<Wardrobe />)} />
            <Route path="/outfits" element={priv(<Outfits />)} />
            <Route path="/style" element={priv(<Style />)} />
            <Route path="/lookbook" element={priv(<Lookbook />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
