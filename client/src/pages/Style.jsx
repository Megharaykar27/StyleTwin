import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Palette, RefreshCw, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import API, { errorMessage, img } from "../lib/api";
import PhotoPicker, { asPhoto } from "../components/PhotoPicker";
import { PageTitle, Spinner, rise, stagger } from "../components/ui";

// Simple silhouettes so people can recognise their shape quickly
const SHAPES = {
  hourglass: "M30 8 H70 L60 50 L72 92 H28 L40 50Z",
  pear: "M38 8 H62 L60 50 L80 92 H20 L40 50Z",
  apple: "M32 8 H68 L78 50 L64 92 H36 L22 50Z",
  rectangle: "M32 8 H68 L68 50 L68 92 H32 L32 50Z",
  "inverted triangle": "M20 8 H80 L62 50 L60 92 H40 L38 50Z",
};
const UNDERTONES = [
  ["warm", "Warm", "Veins look greenish · gold jewellery suits you"],
  ["cool", "Cool", "Veins look blue or purple · silver suits you"],
  ["neutral", "Neutral", "A mix of both · both metals work"],
  ["", "Not sure", "Let the AI decide from your photo"],
];
const GOALS = ["Minimal chic", "Classic & elegant", "Streetwear", "Boho", "Indo-western fusion", "Glam", "Sporty"];

function Result({ p, onRedo }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-5 lg:grid-cols-3">
      <motion.div variants={rise} className="glass relative overflow-hidden p-7 lg:col-span-2">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-aura-pink/25 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-aura-pink">Your signature style</p>
        <h2 className="relative mt-3 text-4xl font-extrabold md:text-5xl">{p.signature_style}</h2>
        <p className="relative mt-3 text-white/60">Colour season: <b className="text-white">{p.color_season}</b></p>
        <div className="relative mt-8">
          <p className="label">Your best colours</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {p.best_colors.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, y: 20, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2 + i * 0.07, type: "spring" }} className="text-center">
                <div className="aspect-square rounded-2xl border border-white/10 shadow-lg" style={{ background: c.hex }} />
                <p className="mt-2 text-xs capitalize text-white/70">{c.name}</p>
              </motion.div>
            ))}
          </div>
          {p.avoid_colors?.length > 0 && (
            <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/50">
              Go easy on:
              {p.avoid_colors.map((c) => (
                <span key={c.name} className="chip"><span className="h-3 w-3 rounded-full" style={{ background: c.hex }} /> {c.name}</span>
              ))}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div variants={rise} className="glass p-7">
        {p.photo && <img src={img(p.photo)} alt="Your photo" className="mb-5 aspect-[3/4] w-full rounded-2xl object-cover" />}
        <p className="label">Body shape</p>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="h-16 w-16 shrink-0"><path d={SHAPES[p.body_shape.type]} fill="url(#sg)" /><defs><linearGradient id="sg"><stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#EC4899" /></linearGradient></defs></svg>
          <div>
            <p className="font-display text-xl font-bold capitalize">{p.body_shape.type}</p>
            {p.body_shape.note && <p className="text-sm text-white/55">{p.body_shape.note}</p>}
          </div>
        </div>
        <p className="label mt-6">Undertone</p>
        <p className="font-display text-xl font-bold capitalize">{p.undertone.type}</p>
        <p className="text-sm text-white/55">{p.undertone.note}</p>
      </motion.div>

      <motion.div variants={rise} className="glass p-7">
        <p className="label">Cuts that flatter you</p>
        <ul className="space-y-2.5">{p.flattering_cuts.map((c) => <li key={c} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-aura-lime" /> {c}</li>)}</ul>
        <p className="label mt-6">Maybe skip</p>
        <ul className="space-y-2.5 text-white/60">{p.avoid_cuts.map((c) => <li key={c} className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-white/35" /> {c}</li>)}</ul>
      </motion.div>

      <motion.div variants={rise} className="glass p-7 lg:col-span-2">
        <p className="label">Your styling tips</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.tips.map((t, i) => (
            <div key={i} className="flex gap-3 rounded-2xl bg-white/[0.04] p-4">
              <span className="font-display text-2xl font-extrabold gradient-text">{i + 1}</span>
              <p className="text-sm leading-relaxed text-white/75">{t}</p>
            </div>
          ))}
        </div>
        <button onClick={onRedo} className="btn-glass mt-6"><RefreshCw size={16} /> Update my profile</button>
        {p.provider === "demo" && <p className="mt-3 text-xs text-amber-200/80">Made in demo mode from your answers. Add a Gemini key for photo analysis.</p>}
      </motion.div>
    </motion.div>
  );
}

export default function Style() {
  const [profile, setProfile] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ bodyShape: "", undertone: "", styleGoal: "", height: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    API.get("/style").then((r) => setProfile(r.data.profile)).catch((e) => toast.error(errorMessage(e)));
  }, []);

  const analyse = async () => {
    setBusy(true);
    const fd = new FormData();
    if (photo) fd.append("photo", photo.file);
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    try {
      const { data } = await API.post("/style", fd);
      setProfile(data.profile);
      setEditing(false);
      toast.success("Your style profile is ready ✨");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (profile === undefined) return <div className="skeleton mt-6 h-96 rounded-3xl" />;

  return (
    <div>
      <PageTitle kicker="Personal stylist" title={<>My <span className="gradient-text">style</span></>} sub="Your colours, the cuts that flatter you, and tips made for you." />

      {profile && !editing ? (
        <Result p={profile} onRedo={() => setEditing(true)} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="glass p-6">
            <p className="label">Full-length photo (recommended)</p>
            <PhotoPicker value={photo} onChange={(f) => setPhoto(asPhoto(f))} label="Add a photo" hint="Stand straight, fitted clothes, natural daylight" />
          </div>
          <div className="glass space-y-7 p-6">
            <div>
              <p className="label">Body shape {photo ? "(optional, AI can tell)" : ""}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {Object.entries(SHAPES).map(([k, d]) => (
                  <button key={k} onClick={() => setForm({ ...form, bodyShape: form.bodyShape === k ? "" : k })} className={`rounded-2xl border p-3 text-center transition ${form.bodyShape === k ? "border-aura-pink bg-aura-pink/10" : "border-white/10 hover:border-white/30"}`}>
                    <svg viewBox="0 0 100 100" className="mx-auto h-12 w-12"><path d={d} fill={form.bodyShape === k ? "#EC4899" : "rgba(255,255,255,0.35)"} /></svg>
                    <p className="mt-1 text-[11px] capitalize">{k}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Skin undertone · check the veins on your wrist</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {UNDERTONES.map(([v, t, d]) => (
                  <button key={t} onClick={() => setForm({ ...form, undertone: v })} className={`rounded-2xl border p-4 text-left transition ${form.undertone === v ? "border-aura-pink bg-aura-pink/10" : "border-white/10 hover:border-white/30"}`}>
                    <p className="font-semibold">{t}</p>
                    <p className="text-xs text-white/50">{d}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label">Style you love</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => <button key={g} onClick={() => setForm({ ...form, styleGoal: form.styleGoal === g ? "" : g })} className={`chip ${form.styleGoal === g ? "chip-on" : ""}`}>{g}</button>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={analyse} disabled={busy || (!photo && !form.bodyShape)} className="btn-primary px-8">
                {busy ? <Spinner /> : <Palette size={18} />} {busy ? "Analysing…" : "Analyse my style"}
              </button>
              {profile && <button onClick={() => setEditing(false)} className="btn-glass">Cancel</button>}
            </div>
            {!photo && !form.bodyShape && <p className="-mt-4 text-xs text-white/40">Add a photo, or choose your body shape, to start.</p>}
            <p className="flex items-start gap-2 text-xs text-white/40"><Sparkles size={14} className="mt-0.5 shrink-0" /> StyleTwin is body-positive: it only suggests what flatters you, never what to "fix".</p>
          </div>
        </div>
      )}
    </div>
  );
}
