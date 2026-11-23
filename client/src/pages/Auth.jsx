import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API, { errorMessage } from "../lib/api";
import { useApp } from "../lib/app";
import { Spinner } from "../components/ui";
import { Logo } from "../components/Navbar";

export default function Auth({ mode }) {
  const register = mode === "register";
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post(register ? "/auth/register" : "/auth/login", form);
      login(data.user, data.token);
      toast.success(register ? `Welcome, ${data.user.name.split(" ")[0]} ✨` : "Welcome back ✨");
      navigate(location.state?.from || "/studio", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-strong relative w-full max-w-md overflow-hidden p-8"
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-aura-pink/30 blur-3xl" />
        <div className="relative">
          <Logo />
          <h1 className="mt-8 text-3xl font-extrabold">{register ? "Create your StyleTwin" : "Welcome back"}</h1>
          <p className="mt-2 text-sm text-white/55">{register ? "Your AI fitting room, wardrobe and stylist in one place." : "Log in to your fitting room."}</p>
          <div className="mt-8 space-y-4">
            {register && (
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" required autoComplete="name" {...f("name")} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" required autoComplete="email" {...f("email")} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" required minLength={6} autoComplete={register ? "new-password" : "current-password"} {...f("password")} />
            </div>
          </div>
          <button disabled={loading} className="btn-primary mt-7 w-full py-3.5">
            {loading && <Spinner />} {register ? "Create account" : "Log in"}
          </button>
          <p className="mt-6 text-center text-sm text-white/55">
            {register ? "Already have an account? " : "New to StyleTwin? "}
            <Link to={register ? "/login" : "/register"} state={location.state} className="font-semibold text-white underline decoration-aura-pink underline-offset-4">
              {register ? "Log in" : "Create one"}
            </Link>
          </p>
        </div>
      </motion.form>
    </div>
  );
}
