import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Heart, Shirt, Sparkles, UserRound, Wand2, X, RotateCcw, Check } from "lucide-react";
import toast from "react-hot-toast";
import API, { errorMessage, img } from "../lib/api";
import { CATEGORY_LABEL, useApp } from "../lib/app";
import PhotoPicker, { asPhoto } from "../components/PhotoPicker";
import CompareSlider from "../components/CompareSlider";
import { PageTitle } from "../components/ui";

const CATS = ["top", "bottom", "dress", "outerwear", "shoes"];
const STAGES = ["Reading your pose…", "Studying the fabric…", "Fitting the outfit to you…", "Matching light and shadows…", "Adding final details…"];

function WardrobeDrawer({ onPick, onClose }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    API.get("/wardrobe").then((r) => setItems(r.data.items)).catch(() => setItems([]));
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm md:items-center md:justify-center" onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} onClick={(e) => e.stopPropagation()} className="glass-strong max-h-[80vh] w-full overflow-y-auto rounded-b-none p-6 md:max-w-3xl md:rounded-b-3xl">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-2xl font-bold">Pick from your wardrobe</p>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {!items ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-white/55">Your wardrobe is empty. Upload an outfit photo instead, or add clothes in the Wardrobe tab.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((g) => (
              <button key={g.id} onClick={() => onPick(g)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white text-left transition hover:-translate-y-1 hover:border-aura-pink">
                <img src={img(g.image)} alt={g.name} className="aspect-square w-full object-contain p-2" />
                <p className="truncate bg-night-3 px-2 py-1.5 text-xs text-white/80">{g.name}</p>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Generating({ slow }) {
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STAGES.length - 1)), slow ? 9000 : 1800);
    const c = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, [slow]);
  return (
    <div className="relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-aura-violet/20 via-night-2 to-aura-pink/20">
      <div className="absolute inset-x-0 h-28 animate-scan bg-gradient-to-b from-transparent via-aura-cyan/35 to-transparent" />
      <div className="relative text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="mx-auto h-16 w-16 rounded-full border-2 border-white/15 border-t-aura-pink" />
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-5 font-display text-lg font-bold">
            {STAGES[i]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-xs text-white/45">{secs}s · {slow ? "the free model usually takes 30–90 seconds" : "usually 5–15 seconds"}</p>
      </div>
    </div>
  );
}

const Step = ({ n, title, done, children }) => (
  <div className="glass p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${done ? "bg-aura-lime text-night" : "bg-white/10"}`}>{done ? <Check size={14} /> : n}</span>
      <p className="font-display text-lg font-bold">{title}</p>
    </div>
    {children}
  </div>
);

export default function Studio() {
  const { aiMode, freeTryOn, sampleModels } = useApp();
  const [params, setParams] = useSearchParams();
  const [person, setPerson] = useState(null); // {file,url} or {fromLook,url}
  const [garment, setGarment] = useState(null); // {file,url} or {garmentId,url,name,category}
  const [category, setCategory] = useState("top");
  const [save, setSave] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [look, setLook] = useState(null);
  const [recent, setRecent] = useState([]);

  // Recent photos of you (from earlier looks) so you don't upload again
  useEffect(() => {
    API.get("/tryon").then((r) => {
      const seen = new Set();
      setRecent(r.data.filter((l) => !seen.has(l.person) && seen.add(l.person)).slice(0, 4));
    }).catch(() => {});
  }, [look]);

  // Coming from the Outfits page with ?garment=ID
  useEffect(() => {
    const id = params.get("garment");
    if (!id) return;
    API.get("/wardrobe").then((r) => {
      const g = r.data.items.find((x) => x.id === id);
      if (g) pickGarment(g);
      setParams({}, { replace: true });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickGarment = (g) => {
    setGarment({ garmentId: g.id, url: img(g.image), name: g.name, category: g.category });
    if (CATS.includes(g.category)) setCategory(g.category);
    setDrawer(false);
    setLook(null);
  };

  // Sample model: fetch the image and use it like an uploaded photo
  const pickSample = async (url, i) => {
    try {
      const blob = await fetch(img(url)).then((r) => r.blob());
      setPerson(asPhoto(new File([blob], `sample-model-${i + 1}.jpg`, { type: blob.type || "image/jpeg" })));
      setLook(null);
    } catch {
      toast.error("Couldn't load the sample photo.");
    }
  };

  const canGo = person && garment && !busy;

  const generate = async () => {
    setBusy(true);
    setLook(null);
    const fd = new FormData();
    if (person.file) fd.append("person", person.file);
    else fd.append("personFrom", person.fromLook);
    if (garment.garmentId) fd.append("garmentId", garment.garmentId);
    else {
      fd.append("garment", garment.file);
      fd.append("saveToWardrobe", String(save));
    }
    fd.append("category", category);
    try {
      const { data } = await API.post("/tryon", fd);
      setLook(data.look);
      // the person photo is now saved on the server: reuse it next time
      setPerson({ fromLook: data.look.id, url: img(data.look.person) });
      if (!garment.garmentId) setGarment({ garmentId: data.garment.id, url: img(data.garment.image), name: data.garment.name, category: data.garment.category });
      if (data.note) toast(data.note, { icon: "ℹ️", duration: 7000 });
      else toast.success(data.look.provider === "demo" ? "Demo preview ready" : "Your look is ready ✨");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleFav = async () => {
    const { data } = await API.patch(`/tryon/${look.id}`, { favorite: !look.favorite });
    setLook(data);
    toast.success(data.favorite ? "Saved to favourites" : "Removed from favourites");
  };

  const download = async () => {
    const blob = await fetch(img(look.result)).then((r) => r.blob());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `styletwin-${look.id}.jpg`;
    a.click();
  };

  const personPhoto = useMemo(() => person && { url: person.url }, [person]);

  return (
    <div>
      <PageTitle kicker="Fitting room" title={<>Try it <span className="gradient-text">on</span></>} sub="Add your photo, pick an outfit, and let the AI dress you." />

      {aiMode === "demo" && (
        <div className="mb-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
          {freeTryOn
            ? <>Free mode: tops and jackets are tried on by the free IDM-VTON model (about 30–90 seconds). Dresses, bottoms and shoes show a preview. Add <code className="rounded bg-black/30 px-1">GEMINI_API_KEY</code> in <code className="rounded bg-black/30 px-1">server/.env</code> for AI tagging and style analysis.</>
            : <>Demo mode: try-ons show a labelled preview. Add <code className="rounded bg-black/30 px-1">GEMINI_API_KEY</code> in <code className="rounded bg-black/30 px-1">server/.env</code> for real AI results.</>}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1.25fr]">
        {/* 1. YOU */}
        <Step n="1" title="Your photo" done={!!person}>
          <PhotoPicker value={personPhoto} onChange={(f) => { setPerson(f ? asPhoto(f) : null); setLook(null); }} label="Add your photo" hint="Front-facing, good light, plain background works best" icon={UserRound} />
          {!person && sampleModels.length > 0 && (
            <div className="mt-4">
              <p className="label">No photo handy? Try a sample model</p>
              <div className="flex gap-2">
                {sampleModels.map((u, i) => (
                  <button key={u} onClick={() => pickSample(u, i)} className="h-16 w-12 overflow-hidden rounded-xl border border-white/10 transition hover:border-aura-pink" aria-label={`Sample model ${i + 1}`}>
                    <img src={img(u)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {!person && recent.length > 0 && (
            <div className="mt-4">
              <p className="label">Or use a recent photo</p>
              <div className="flex gap-2">
                {recent.map((l) => (
                  <button key={l.id} onClick={() => setPerson({ fromLook: l.id, url: img(l.person) })} className="h-16 w-12 overflow-hidden rounded-xl border border-white/10 transition hover:border-aura-pink">
                    <img src={img(l.person)} alt="Recent photo" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Step>

        {/* 2. OUTFIT */}
        <Step n="2" title="The outfit" done={!!garment}>
          <PhotoPicker
            value={garment && { url: garment.url }}
            onChange={(f) => { setGarment(f ? asPhoto(f) : null); setLook(null); }}
            label="Add an outfit"
            hint="A product photo or a screenshot from any shopping site"
            icon={Shirt}
            camera={false}
          />
          <button onClick={() => setDrawer(true)} className="btn-glass mt-3 w-full py-2.5">
            <Shirt size={16} /> Choose from wardrobe
          </button>
          <p className="label mt-5">It's a…</p>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`chip ${category === c ? "chip-on" : ""}`}>{CATEGORY_LABEL[c]}</button>
            ))}
          </div>
          {garment?.file && (
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="h-4 w-4 accent-pink-500" /> Also add it to my wardrobe
            </label>
          )}
        </Step>

        {/* 3. RESULT */}
        <div className="glass p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-bold">Your look</p>
            {look && <span className="text-xs text-white/40">{look.seconds?.toFixed(1)}s</span>}
          </div>
          {busy ? (
            <Generating slow={aiMode === "demo" && freeTryOn && ["top", "outerwear"].includes(category)} />
          ) : look ? (
            <motion.div initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.6 }}>
              <CompareSlider before={img(look.person)} after={img(look.result)} className="aspect-[3/4]" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button onClick={toggleFav} className="btn-glass px-3 py-2.5">
                  <Heart size={16} className={look.favorite ? "fill-aura-pink text-aura-pink" : ""} /> {look.favorite ? "Saved" : "Save"}
                </button>
                <button onClick={download} className="btn-glass px-3 py-2.5"><Download size={16} /> Download</button>
                <button onClick={() => { setGarment(null); setLook(null); }} className="btn-glass px-3 py-2.5"><RotateCcw size={16} /> Next</button>
              </div>
            </motion.div>
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <div>
                <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aura-violet/40 to-aura-pink/40">
                  <Sparkles size={26} />
                </motion.span>
                <p className="mt-4 font-display text-lg font-bold">{person && garment ? "Ready when you are" : "Your try-on appears here"}</p>
                <p className="mt-1 text-sm text-white/50">{!person ? "Start with your photo." : !garment ? "Now pick an outfit." : "Hit the button below."}</p>
              </div>
            </div>
          )}
          <button onClick={generate} disabled={!canGo} className="btn-primary mt-4 w-full py-4 text-base">
            <Wand2 size={18} /> {busy ? "Creating your look…" : look ? "Try again" : "Try it on"}
          </button>
        </div>
      </div>

      <AnimatePresence>{drawer && <WardrobeDrawer onPick={pickGarment} onClose={() => setDrawer(false)} />}</AnimatePresence>
    </div>
  );
}
