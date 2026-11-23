// Slowly moving glowing colour blobs behind every page (the "aurora")
import { useEffect } from "react";

export default function Aurora() {
  // The pink blob gently follows the mouse
  useEffect(() => {
    const el = document.getElementById("aurora-follow");
    const move = (e) => {
      if (!el) return;
      el.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night">
      <div className="absolute -left-40 -top-40 h-[42rem] w-[42rem] animate-drift rounded-full bg-aura-violet/30 blur-[140px]" />
      <div className="absolute -right-40 top-1/4 h-[36rem] w-[36rem] animate-drift-slow rounded-full bg-aura-pink/25 blur-[140px]" />
      <div className="absolute -bottom-52 left-1/4 h-[40rem] w-[40rem] animate-drift rounded-full bg-aura-blue/20 blur-[150px]" />
      <div id="aurora-follow" className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-aura-pink/10 blur-[120px] transition-transform duration-[1200ms] ease-out" />
      {/* fine grain so the gradients don't band */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22140%22 height=%22140%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]" />
    </div>
  );
}
