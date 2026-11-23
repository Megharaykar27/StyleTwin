import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CloudRain, Snowflake, Sparkles, Sun, CloudSun, Wand2, Shirt } from "lucide-react";
import toast from "react-hot-toast";
import API, { errorMessage, img } from "../lib/api";
import { CATEGORY_LABEL } from "../lib/app";
import { Empty, PageTitle, ScoreRing, Spinner } from "../components/ui";

const OCCASIONS = [["college", "🎒", "College"], ["everyday", "☕", "Everyday"], ["office", "💼", "Office"], ["interview", "🤝", "Interview"], ["date", "🌙", "Date night"], ["party", "🎉", "Party"], ["festive", "🪔", "Wedding / festive"]];
const WEATHER = [["hot", Sun, "Hot"], ["mild", CloudSun, "Mild"], ["cold", Snowflake, "Cold"], ["rainy", CloudRain, "Rainy"]];

function Bar({ label, value, delay }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-white/50"><span>{label}</span><span>{Math.round(value * 100)}</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ delay, duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-aura-violet to-aura-pink" />
      </div>
    </div>
  );
}

export default function Outfits() {
  const navigate = useNavigate();
  const [occasion, setOccasion] = useState("college");
  const [weather, setWeather] = useState("hot");
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(null);

  useEffect(() => {
    API.get("/wardrobe").then((r) => setCount(r.data.stats.total)).catch(() => setCount(0));
  }, []);

  const go = async () => {
    setBusy(true);
    try {
      const { data } = await API.post("/style/outfits", { occasion, weather });
      setPlan(data);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (count === 0)
    return (
      <>
        <PageTitle kicker="AI stylist" title={<>Outfit <span className="gradient-text">planner</span></>} />
        <Empty icon={Shirt} title="Add clothes first" text="The planner builds outfits from clothes you own. Add at least one top and one bottom (or a dress).">
          <Link to="/wardrobe" className="btn-primary">Go to wardrobe</Link>
        </Empty>
      </>
    );

  return (
    <div>
      <PageTitle kicker="AI stylist" title={<>What should I <span className="gradient-text">wear?</span></>} sub="Pick the occasion and the weather. StyleTwin checks every combination in your wardrobe and picks the best three." />

      <div className="glass p-6">
        <p className="label">Occasion</p>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map(([v, e, l]) => (
            <button key={v} onClick={() => setOccasion(v)} className={`chip px-4 py-2 text-sm ${occasion === v ? "chip-on" : ""}`}>
              <span>{e}</span> {l}
            </button>
          ))}
        </div>
        <p className="label mt-6">Weather</p>
        <div className="flex flex-wrap gap-2">
          {WEATHER.map(([v, Icon, l]) => (
            <button key={v} onClick={() => setWeather(v)} className={`chip px-4 py-2 text-sm ${weather === v ? "chip-on" : ""}`}>
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>
        <button onClick={go} disabled={busy} className="btn-primary mt-7 px-8 py-3.5 text-base">
          {busy ? <Spinner /> : <Sparkles size={18} />} {busy ? "Styling…" : "Style me"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {plan && (
          <motion.div key={plan.occasion + plan.weather} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
            <p className="mb-5 text-sm text-white/55">
              Checked <b className="text-white">{plan.combinations}</b> combinations · <b className="text-white">{plan.possible}</b> work well for this occasion
            </p>
            <div className="grid gap-5 lg:grid-cols-3">
              {plan.outfits.map((o, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12, type: "spring", stiffness: 120, damping: 18 }} className="glass flex flex-col p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-display text-xl font-bold">Look {i + 1}</p>
                    <ScoreRing value={o.score} size={52} />
                  </div>
                  <div className={`grid gap-2 ${o.items.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                    {o.items.map((g, k) => (
                      <motion.div key={g.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 + k * 0.07 }} className={`overflow-hidden rounded-2xl bg-white ${k === 0 && o.items.length === 3 ? "row-span-2" : ""}`}>
                        <img src={img(g.image)} alt={g.name} className="h-full w-full object-contain p-2" />
                        <p className="truncate bg-night-3 px-2 py-1 text-[11px] text-white/70">{CATEGORY_LABEL[g.category]} · {g.name}</p>
                      </motion.div>
                    ))}
                  </div>
                  {o.note && <p className="mt-4 text-sm leading-relaxed text-white/70">“{o.note}”</p>}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    <Bar label="Occasion fit" value={o.parts.formality} delay={0.3 + i * 0.1} />
                    <Bar label="Colours" value={o.parts.colour} delay={0.4 + i * 0.1} />
                    <Bar label="Weather" value={o.parts.weather} delay={0.5 + i * 0.1} />
                    <Bar label="Patterns" value={o.parts.pattern} delay={0.6 + i * 0.1} />
                  </div>
                  <button onClick={() => navigate(`/studio?garment=${o.items[0].id}`)} className="btn-glass mt-5 w-full">
                    <Wand2 size={16} /> Try the {CATEGORY_LABEL[o.items[0].category].toLowerCase()} on
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
