import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Lock, Palette, Shirt, Sparkles, Wand2, Trash2, EyeOff } from "lucide-react";
import Mannequin from "../components/Mannequin";
import { TiltCard, rise, stagger } from "../components/ui";
import { Logo } from "../components/Navbar";

const FEATURES = [
  { icon: Wand2, title: "AI virtual try-on", text: "Upload a photo or use your camera, pick any outfit, and see it on you in seconds. Drag the slider to compare before and after.", glow: "from-aura-violet/50" },
  { icon: Shirt, title: "Smart wardrobe", text: "Snap your clothes. AI names and tags each piece by type, colour, pattern, formality and season, automatically.", glow: "from-aura-pink/50" },
  { icon: Sparkles, title: "Outfit planner", text: "Pick an occasion and the weather. StyleTwin builds complete outfits from clothes you already own, scored for colour and fit.", glow: "from-aura-cyan/40" },
  { icon: Palette, title: "Your style profile", text: "Discover your colour palette, the cuts that flatter your shape, and personal styling tips, kindly and body-positive.", glow: "from-aura-blue/50" },
];

const STEPS = [
  ["01", "Add your photo", "A clear, front-facing photo, from your gallery or the camera."],
  ["02", "Pick an outfit", "From your wardrobe, a screenshot of something online, or a product photo."],
  ["03", "See it on you", "AI dresses you in it, keeping your face, pose and background."],
];

export default function Home() {
  return (
    <div className="-mt-6">
      {/* HERO */}
      <section className="grid items-center gap-14 pb-20 pt-6 md:grid-cols-2 md:pt-12">
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.span variants={rise} className="chip">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-lime" /> AI-powered fashion studio
          </motion.span>
          <motion.h1 variants={rise} className="mt-6 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.1rem]">
            See it on you.
            <br />
            <span className="gradient-text">Before you buy it.</span>
          </motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-md text-lg text-white/60">
            StyleTwin is your AI fitting room: try on any outfit from a single photo, organise your wardrobe, and get outfits planned for every occasion.
          </motion.p>
          <motion.div variants={rise} className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary px-7 py-3.5 text-base">
              Try it free <ArrowRight size={18} />
            </Link>
            <a href="#how" className="btn-glass px-7 py-3.5 text-base">How it works</a>
          </motion.div>
          <motion.div variants={rise} className="mt-10 flex items-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-2"><Camera size={16} /> Works with your camera</span>
            <span className="flex items-center gap-2"><Lock size={16} /> Private by design</span>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          <Mannequin />
        </motion.div>
      </section>

      {/* TICKER */}
      <div className="relative -mx-4 overflow-hidden border-y border-white/10 py-4 md:-mx-6">
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="flex w-max gap-10 whitespace-nowrap font-display text-2xl font-bold text-white/25">
          {[...Array(2)].flatMap((_, k) =>
            ["Virtual try-on", "Wardrobe AI", "Outfit planner", "Colour analysis", "Before / after", "Lookbook"].map((t) => (
              <span key={t + k} className="flex items-center gap-10">
                {t} <span className="text-aura-pink">✦</span>
              </span>
            ))
          )}
        </motion.div>
      </div>

      {/* FEATURES */}
      <section className="py-24">
        <h2 className="max-w-2xl text-4xl font-extrabold md:text-5xl">
          One app for <span className="gradient-text">everything you wear.</span>
        </h2>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text, glow }) => (
            <motion.div key={title} variants={rise}>
              <TiltCard className="glass group relative h-full overflow-hidden p-7">
                <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-60 blur-2xl transition group-hover:opacity-100`} />
                <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
                  <Icon size={22} />
                </span>
                <h3 className="relative mt-6 text-2xl font-bold">{title}</h3>
                <p className="relative mt-2 leading-relaxed text-white/60">{text}</p>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW */}
      <section id="how" className="scroll-mt-28 pb-24">
        <h2 className="text-4xl font-extrabold md:text-5xl">Three steps. About ten seconds.</h2>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent md:block" />
          {STEPS.map(([n, t, d], i) => (
            <motion.div key={n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="glass relative p-7">
              <span className="font-display text-5xl font-extrabold gradient-text">{n}</span>
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-white/60">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRIVACY */}
      <section className="pb-24">
        <div className="glass grid gap-8 p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-aura-lime/15 text-aura-lime"><Lock size={22} /></span>
            <h2 className="mt-5 text-3xl font-extrabold">Your photos stay yours.</h2>
          </div>
          <ul className="grid gap-4 text-white/65 sm:grid-cols-2">
            {[
              [EyeOff, "Hidden location data (GPS) is removed from every photo you upload."],
              [Lock, "Images are stored under long random names that can't be guessed."],
              [Trash2, "Delete any look, or your whole account and every photo, in one click."],
              [Sparkles, "Photos are only sent to the AI to create your try-on, never shared or sold."],
            ].map(([Icon, t]) => (
              <li key={t} className="flex gap-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-aura-pink" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-aura-violet via-fuchsia-600 to-aura-pink p-10 text-center md:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
        <h2 className="relative text-4xl font-extrabold md:text-5xl">Your AI fitting room is ready.</h2>
        <p className="relative mx-auto mt-4 max-w-md text-white/80">Free to use. No credit card. Just you and your style.</p>
        <Link to="/register" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-night transition hover:scale-105">
          Create your StyleTwin <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-sm text-white/40 md:flex-row">
        <Logo />
        <p>Built by Megha Raykar · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
