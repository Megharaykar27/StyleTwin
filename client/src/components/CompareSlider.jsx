// Before / after slider: drag the handle to compare the original photo
// with the try-on result. Works with mouse, touch and keyboard arrows.
import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export default function CompareSlider({ before, after, className = "" }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);

  const setFromEvent = useCallback((clientX) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onDown = (e) => {
    setFromEvent(e.clientX);
    const move = (ev) => setFromEvent(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div ref={ref} onPointerDown={onDown} className={`relative select-none overflow-hidden rounded-3xl touch-none ${className}`}>
      <img src={after} alt="Try-on result" className="block h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Original photo" className="h-full w-full object-cover" draggable={false} />
      </div>
      <span className="glass-strong absolute left-3 top-3 rounded-full px-3 py-1 text-xs">Before</span>
      <span className="glass-strong absolute right-3 top-3 rounded-full px-3 py-1 text-xs">After</span>
      <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" style={{ left: `${pos}%` }}>
        <button
          aria-label="Drag to compare before and after"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
            if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
          }}
          className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-night shadow-xl"
        >
          <ChevronsLeftRight size={20} />
        </button>
      </div>
    </div>
  );
}
