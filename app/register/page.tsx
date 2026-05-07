"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    router.push("/");
  };

  return (
    <div className="trello-auth-bg min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-white">
          <rect x="2" y="2" width="9" height="14" rx="2"/>
          <rect x="13" y="2" width="9" height="9" rx="2"/>
        </svg>
        <span className="text-white font-bold text-3xl tracking-tight">TaskFlow</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        <h1 className="text-[#172b4d] text-xl font-semibold text-center mb-2">Sign up for your account</h1>
        <p className="text-[#5e6c84] text-sm text-center mb-6">No credit card required.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            type="text"
            placeholder="Enter your name"
            className="trello-input"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className="trello-input"
            value={form.email}
            onChange={handleChange}
            required
          />
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              placeholder="Create a password"
              className="trello-input pr-10"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5e6c84] hover:text-[#172b4d] transition"
            >
              {showPass ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#eb5a46] text-xs bg-[#ffebe6] border border-[#ffbdad] rounded px-3 py-2">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="trello-btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Creating account...
              </span>
            ) : "Sign up"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#dfe1e6]"/></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#5e6c84]">OR</span></div>
        </div>

        <p className="text-center text-sm text-[#5e6c84]">
          Already have an account?{" "}
          <Link href="/" className="text-[#0079bf] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>

      <p className="text-white/60 text-xs mt-6 text-center max-w-sm">
        By signing up, you confirm that you&apos;ve read and accepted our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
