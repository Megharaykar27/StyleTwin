// Drop a photo, choose a file, or take one with the camera
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";

function CameraModal({ onClose, onCapture }) {
  const video = useRef(null);
  const [facing, setFacing] = useState("user");
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } } })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setError("Camera not available. Please allow camera access, or upload a photo instead."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [facing]);

  const snap = () => {
    const v = video.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (facing === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); } // un-mirror the selfie
    ctx.drawImage(v, 0, 0);
    c.toBlob((b) => onCapture(new File([b], "camera.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-strong w-full max-w-lg overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-lg font-bold">Take a photo</p>
          <button onClick={onClose} aria-label="Close camera"><X size={20} /></button>
        </div>
        {error ? (
          <p className="rounded-2xl bg-white/5 p-6 text-center text-sm text-white/70">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video ref={video} autoPlay playsInline muted className={`aspect-[3/4] w-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`} />
            {/* guide outline: stand inside it */}
            <div className="pointer-events-none absolute inset-x-[18%] inset-y-[6%] rounded-[45%_45%_12%_12%] border-2 border-dashed border-white/40" />
          </div>
        )}
        <p className="mt-3 text-center text-xs text-white/50">Stand back so your upper body (or full body) is inside the outline, facing the camera.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="btn-glass" aria-label="Switch camera">
            <RefreshCw size={16} />
          </button>
          <button onClick={snap} disabled={!!error} className="btn-primary px-8">
            <Camera size={16} /> Capture
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PhotoPicker({ value, onChange, label, hint, camera = true, aspect = "aspect-[3/4]", icon: Icon = ImagePlus }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [cam, setCam] = useState(false);

  const take = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 10 * 1024 * 1024) return toast.error("That image is too big (max 10 MB)");
    onChange(file);
  };

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); }}
        className={`group relative ${aspect} w-full overflow-hidden rounded-3xl border-2 border-dashed transition ${drag ? "border-aura-pink bg-aura-pink/10" : "border-white/15 bg-white/[0.03] hover:border-white/30"}`}
      >
        {value ? (
          <>
            <img src={value.url} alt={label} className="h-full w-full object-cover" />
            <button onClick={() => onChange(null)} className="glass-strong absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full" aria-label="Remove photo">
              <X size={16} />
            </button>
          </>
        ) : (
          <button onClick={() => input.current.click()} className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <motion.span whileHover={{ scale: 1.08, rotate: -4 }} className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aura-violet/40 to-aura-pink/40">
              <Icon size={26} />
            </motion.span>
            <span className="font-display text-lg font-bold">{label}</span>
            <span className="max-w-[14rem] text-xs text-white/50">{hint}</span>
          </button>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files[0]); e.target.value = ""; }} />
      </div>
      {camera && !value && (
        <button onClick={() => setCam(true)} className="btn-glass mt-3 w-full py-2.5">
          <Camera size={16} /> Use camera
        </button>
      )}
      <AnimatePresence>
        {cam && (
          <CameraModal
            onClose={() => setCam(false)}
            onCapture={(f) => {
              setCam(false);
              take(f);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Turn a File into { file, url } for previews
export const asPhoto = (file) => (file ? { file, url: URL.createObjectURL(file) } : null);
