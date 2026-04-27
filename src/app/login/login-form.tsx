"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErr("Invalid email or password. Please try again.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div
      className="rounded-xl p-px"
      style={{
        background: "linear-gradient(135deg, rgba(0,137,147,0.3), rgba(0,206,196,0.1), rgba(255,255,255,0.05))",
      }}
    >
      <div className="rounded-[calc(0.75rem-1px)] bg-card p-7">
        {/* Header */}
        <div className="mb-7">
          <h2 className="text-xl font-bold text-foreground">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@adarshshipping.in"
              className="h-11 focus:border-[#008993] focus:ring-[#008993]/20 transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="h-11 focus:border-[#008993] focus:ring-[#008993]/20 transition-all duration-200"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {err && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-sm text-red-400"
              >
                <AlertCircle className="size-4 shrink-0" />
                {err}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            whileHover={{ boxShadow: "0 0 24px rgba(0,137,147,0.35)" }}
            className="relative w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden"
            style={{
              background: loading
                ? "#008993"
                : "linear-gradient(135deg, #008993 0%, #00cec4 100%)",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="size-4" />
                </>
              )}
            </span>
          </motion.button>
        </form>

        {/* Footer note */}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Contact your administrator if you need access
        </p>
      </div>
    </div>
  );
}
