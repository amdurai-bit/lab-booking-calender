"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { login, register } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    full_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await login(form.email, form.password);
        setAuth(data.user, data.access_token);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        const data = await register({
          email: form.email,
          password: form.password,
          username: form.username,
          full_name: form.full_name,
        });
        toast.success("Account created. Please sign in.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
      <div className="archive-card p-8 w-full max-w-md shadow-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-ink-700 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl text-parchment-100">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-ink-800 font-serif">Missionary Archive</h1>
          <p className="text-ink-500 text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ink-700 text-parchment-100 rounded font-medium hover:bg-ink-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <button onClick={() => setMode("register")} className="text-ink-700 underline">
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-ink-700 underline">
                Sign in
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-ink-400 hover:text-ink-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
