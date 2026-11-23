import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, Pencil, Plus, Shirt, Trash2, Upload, Wand2, X } from "lucide-react";
import toast from "react-hot-toast";
import API, { errorMessage, img } from "../lib/api";
import { CATEGORY_LABEL } from "../lib/app";
import { Empty, PageTitle, Spinner, TiltCard, rise, stagger } from "../components/ui";

const CATS = Object.keys(CATEGORY_LABEL);
const SEASONS = ["summer", "monsoon", "winter", "spring", "autumn", "all"];
const STYLES = ["casual", "smart", "formal", "ethnic", "sporty", "party", "boho"];
const PATTERNS = ["solid", "striped", "checked", "floral", "printed", "embroidered", "textured"];
const FORMALITY = ["", "Very relaxed", "Casual", "Smart casual", "Formal", "Very formal"];

function EditModal({ item, onClose, onSaved, onDeleted }) {
  const [f, setF] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/wardrobe/${item.id}`, { name: f.name, category: f.category, pattern: f.pattern, style: f.style, formality: f.formality, seasons: f.seasons });
      onSaved(data);
      toast.success("Updated");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!window.confirm(`Remove "${item.name}" from your wardrobe?`)) return;
    await API.delete(`/wardrobe/${item.id}`);
    onDeleted(item.id);
    toast.success("Removed");
  };
  const toggleSeason = (s) => setF({ ...f, seasons: f.seasons.includes(s) ? f.seasons.filter((x) => x !== s) : [...f.seasons, s] });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()} className="glass-strong grid w-full max-w-3xl gap-6 p-6 md:grid-cols-[1fr_1.3fr]">
        <div className="overflow-hidden rounded-2xl bg-white">
          <img src={img(item.image)} alt={item.name} className="aspect-square w-full object-contain p-4" />
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <input className="input font-display text-lg font-bold" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Name" />
            <button onClick={onClose} aria-label="Close" className="mt-2"><X /></button>
          </div>
          <p className="flex items-center gap-2 text-xs text-white/45">
            <span className="h-4 w-4 rounded-full border border-white/20" style={{ background: item.color_hex }} /> {item.color} · tagged by {item.tagged_by === "user" ? "you" : item.tagged_by === "gemini" ? "AI" : "demo AI"}
          </p>
          <div>
            <p className="label">Type</p>
            <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} onClick={() => setF({ ...f, category: c })} className={`chip ${f.category === c ? "chip-on" : ""}`}>{CATEGORY_LABEL[c]}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="label">Style</p>
              <select className="input py-2.5" value={f.style} onChange={(e) => setF({ ...f, style: e.target.value })}>{STYLES.map((s) => <option key={s} className="bg-night">{s}</option>)}</select>
            </div>
            <div>
              <p className="label">Pattern</p>
              <select className="input py-2.5" value={f.pattern} onChange={(e) => setF({ ...f, pattern: e.target.value })}>{PATTERNS.map((s) => <option key={s} className="bg-night">{s}</option>)}</select>
            </div>
          </div>
          <div>
            <p className="label">Formality: {FORMALITY[f.formality]}</p>
            <input type="range" min={1} max={5} value={f.formality} onChange={(e) => setF({ ...f, formality: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <p className="label">Seasons</p>
            <div className="flex flex-wrap gap-2">{SEASONS.map((s) => <button key={s} onClick={() => toggleSeason(s)} className={`chip capitalize ${f.seasons.includes(s) ? "chip-on" : ""}`}>{s}</button>)}</div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving && <Spinner />} Save changes</button>
            <button onClick={remove} className="btn-glass px-4 text-red-300" aria-label="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Wardrobe() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [cat, setCat] = useState("all");
  const [color, setColor] = useState(null);
  const [uploading, setUploading] = useState(0);
  const [editing, setEditing] = useState(null);
  const [drag, setDrag] = useState(false);
  const input = useRef(null);

  const load = () => API.get("/wardrobe").then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const upload = async (files) => {
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, 10);
    if (!list.length) return;
    setUploading(list.length);
    const fd = new FormData();
    list.forEach((f) => fd.append("images", f));
    try {
      const { data: d } = await API.post("/wardrobe", fd);
      toast.success(`${d.message} ✨`);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(0);
    }
  };

  const colors = useMemo(() => {
    const m = new Map();
    data?.items.forEach((g) => m.set(g.color, g.color_hex));
    return [...m.entries()];
  }, [data]);
  const shown = data?.items.filter((g) => (cat === "all" || g.category === cat) && (!color || g.color === color)) || [];

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
    >
      <PageTitle kicker="Your closet" title={<>My <span className="gradient-text">wardrobe</span></>} sub="Snap your clothes. AI tags every piece so StyleTwin can plan outfits from what you own.">
        <button onClick={() => input.current.click()} disabled={!!uploading} className="btn-primary">
          {uploading ? <><Spinner /> Tagging {uploading}…</> : <><Plus size={18} /> Add clothes</>}
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      </PageTitle>

      <AnimatePresence>
        {drag && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-4 z-50 grid place-items-center rounded-[2rem] border-2 border-dashed border-aura-pink bg-aura-pink/10 backdrop-blur-sm">
            <p className="font-display text-3xl font-bold"><Upload className="mr-2 inline" /> Drop to add up to 10 items</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-3xl" />)}</div>
      ) : data.items.length === 0 ? (
        <Empty icon={Shirt} title="Your wardrobe is empty" text="Add photos of your clothes, one item per photo on a plain background works best. Drag and drop works too.">
          <button onClick={() => input.current.click()} className="btn-primary"><Plus size={18} /> Add your first items</button>
        </Empty>
      ) : (
        <>
          {/* stats */}
          <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-7">
            <div className="glass col-span-3 p-4 sm:col-span-1">
              <p className="font-display text-3xl font-extrabold gradient-text">{data.stats.total}</p>
              <p className="text-xs text-white/50">items</p>
            </div>
            {CATS.map((c) => (
              <div key={c} className="glass p-4">
                <p className="font-display text-2xl font-bold">{data.stats[c]}</p>
                <p className="text-xs text-white/50">{CATEGORY_LABEL[c]}</p>
              </div>
            ))}
          </div>

          {/* filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {["all", ...CATS].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "chip-on" : ""}`}>{c === "all" ? "All" : CATEGORY_LABEL[c]}</button>
            ))}
            <span className="mx-2 h-6 w-px bg-white/10" />
            {colors.map(([name, hex]) => (
              <button key={name} title={name} onClick={() => setColor(color === name ? null : name)} className={`h-7 w-7 rounded-full border-2 transition ${color === name ? "scale-110 border-white" : "border-white/15"}`} style={{ background: hex }} aria-label={`Filter ${name}`} />
            ))}
          </div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {uploading > 0 && [...Array(uploading)].map((_, i) => <div key={`u${i}`} className="skeleton aspect-[4/5] rounded-3xl" />)}
            {shown.map((g) => (
              <motion.div key={g.id} variants={rise} layout>
                <TiltCard className="glass group relative overflow-hidden p-2">
                  <button onClick={() => setEditing(g)} className="block w-full text-left">
                    <div className="overflow-hidden rounded-2xl bg-white">
                      <img src={img(g.image)} alt={g.name} loading="lazy" className="aspect-square w-full object-contain p-3 transition duration-500 group-hover:scale-105" />
                    </div>
                    <div className="px-2 pb-1 pt-3">
                      <p className="truncate font-medium">{g.name}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: g.color_hex }} />
                        {CATEGORY_LABEL[g.category]} · {g.style}
                      </div>
                    </div>
                  </button>
                  <div className="absolute right-4 top-4 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => navigate(`/studio?garment=${g.id}`)} className="glass-strong grid h-9 w-9 place-items-center rounded-full text-night" title="Try it on" aria-label="Try it on"><Wand2 size={15} className="text-white" /></button>
                    <button onClick={() => setEditing(g)} className="glass-strong grid h-9 w-9 place-items-center rounded-full" title="Edit" aria-label="Edit"><Pencil size={15} /></button>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
          {shown.length === 0 && <p className="py-10 text-center text-white/50">Nothing matches these filters.</p>}

          {data.gaps.length > 0 && (
            <div className="glass mt-8 p-6">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><Lightbulb size={18} className="text-amber-300" /> To make more outfits, add…</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.gaps.map((g) => (
                  <div key={g.piece} className="rounded-2xl bg-white/[0.04] p-4">
                    <p className="font-medium">{g.piece}</p>
                    <p className="mt-0.5 text-sm text-white/50">{g.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {editing && (
          <EditModal
            item={editing}
            onClose={() => setEditing(null)}
            onSaved={(g) => { setEditing(null); setData((d) => ({ ...d, items: d.items.map((x) => (x.id === g.id ? g : x)) })); }}
            onDeleted={() => { setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
