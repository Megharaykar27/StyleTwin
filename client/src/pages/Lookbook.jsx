import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookHeart, Columns2, Heart, Trash2, X, Wand2 } from "lucide-react";
import toast from "react-hot-toast";
import API, { errorMessage, img } from "../lib/api";
import CompareSlider from "../components/CompareSlider";
import { Empty, PageTitle } from "../components/ui";

const when = (d) => new Date(d.replace(" ", "T") + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function Lookbook() {
  const [looks, setLooks] = useState(null);
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState(null);
  const [compare, setCompare] = useState([]);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    API.get("/tryon").then((r) => setLooks(r.data)).catch((e) => toast.error(errorMessage(e)));
  }, []);

  const fav = async (l) => {
    const { data } = await API.patch(`/tryon/${l.id}`, { favorite: !l.favorite });
    setLooks((ls) => ls.map((x) => (x.id === l.id ? data : x)));
    if (open?.id === l.id) setOpen(data);
  };
  const remove = async (l) => {
    if (!window.confirm("Delete this look?")) return;
    await API.delete(`/tryon/${l.id}`);
    setLooks((ls) => ls.filter((x) => x.id !== l.id));
    setOpen(null);
    toast.success("Deleted");
  };
  const pick = (l) => setCompare((c) => (c.includes(l.id) ? c.filter((x) => x !== l.id) : [...c, l.id].slice(-2)));

  if (!looks) return <div className="grid grid-cols-2 gap-4 pt-24 md:grid-cols-4">{[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-3xl" />)}</div>;
  const shown = favOnly ? looks.filter((l) => l.favorite) : looks;
  const pair = compare.map((id) => looks.find((l) => l.id === id)).filter(Boolean);

  return (
    <div>
      <PageTitle kicker="Saved looks" title={<>Look<span className="gradient-text">book</span></>} sub="Every outfit you've tried on. Pick two to compare side by side.">
        <div className="flex gap-2">
          <button onClick={() => setFavOnly((f) => !f)} className={`chip px-4 py-2 text-sm ${favOnly ? "chip-on" : ""}`}><Heart size={15} /> Favourites</button>
          <button onClick={() => setComparing(true)} disabled={pair.length !== 2} className="btn-glass px-4 py-2"><Columns2 size={16} /> Compare {pair.length}/2</button>
        </div>
      </PageTitle>

      {looks.length === 0 ? (
        <Empty icon={BookHeart} title="No looks yet" text="Your try-ons will appear here automatically.">
          <Link to="/studio" className="btn-primary"><Wand2 size={18} /> Go to the studio</Link>
        </Empty>
      ) : (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {shown.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }} className={`group relative mb-4 break-inside-avoid overflow-hidden rounded-3xl border-2 transition ${compare.includes(l.id) ? "border-aura-pink" : "border-transparent"}`}>
              <button onClick={() => setOpen(l)} className="block w-full">
                <img src={img(l.result)} alt="Saved look" loading="lazy" className="w-full transition duration-500 group-hover:scale-[1.03]" />
              </button>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                <span className="text-xs text-white/80">{when(l.created_at)}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => pick(l)} className="glass-strong grid h-8 w-8 place-items-center rounded-full" aria-label="Select to compare" title="Compare"><Columns2 size={14} /></button>
                  <button onClick={() => fav(l)} className="glass-strong grid h-8 w-8 place-items-center rounded-full" aria-label="Favourite"><Heart size={14} className={l.favorite ? "fill-aura-pink text-aura-pink" : ""} /></button>
                </div>
              </div>
              {l.favorite && <Heart size={16} className="absolute right-3 top-3 fill-aura-pink text-aura-pink drop-shadow" />}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
            <motion.div initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }} onClick={(e) => e.stopPropagation()} className="glass-strong grid w-full max-w-4xl gap-5 p-5 md:grid-cols-[1.4fr_1fr]">
              <CompareSlider before={img(open.person)} after={img(open.result)} className="aspect-[3/4]" />
              <div className="flex flex-col">
                <div className="flex justify-between"><p className="font-display text-2xl font-bold">Look details</p><button onClick={() => setOpen(null)} aria-label="Close"><X /></button></div>
                <p className="label mt-6">Outfit</p>
                <div className="w-40 overflow-hidden rounded-2xl bg-white"><img src={img(open.garment)} alt="Garment" className="aspect-square w-full object-contain p-2" /></div>
                <p className="mt-4 text-sm text-white/50">Created {when(open.created_at)} · {open.provider === "demo" ? "demo preview" : "AI try-on"}</p>
                <div className="mt-auto flex gap-2 pt-6">
                  <button onClick={() => fav(open)} className="btn-glass flex-1"><Heart size={16} className={open.favorite ? "fill-aura-pink text-aura-pink" : ""} /> {open.favorite ? "Favourite" : "Add to favourites"}</button>
                  <button onClick={() => remove(open)} className="btn-glass px-4 text-red-300" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {comparing && pair.length === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setComparing(false)}>
            <motion.div initial={{ y: 30 }} animate={{ y: 0 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-4xl p-5">
              <div className="mb-4 flex justify-between"><p className="font-display text-2xl font-bold">Which one wins?</p><button onClick={() => setComparing(false)} aria-label="Close"><X /></button></div>
              <div className="grid grid-cols-2 gap-4">
                {pair.map((l, i) => (
                  <div key={l.id}>
                    <img src={img(l.result)} alt={`Look ${i + 1}`} className="aspect-[3/4] w-full rounded-2xl object-cover" />
                    <button onClick={() => fav(l)} className="btn-glass mt-3 w-full"><Heart size={16} className={l.favorite ? "fill-aura-pink text-aura-pink" : ""} /> {l.favorite ? "Favourite" : "This one"}</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
