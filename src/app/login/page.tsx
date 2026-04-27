import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { FadeIn, SlideIn, FloatIn } from "@/components/motion-div";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #008993 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #ff8333 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #00cec4 0%, transparent 70%)" }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          {/* Left — branding */}
          <FadeIn delay={0.05}>
            <section className="space-y-8 text-center lg:text-left">
              {/* Logo */}
              <div className="inline-block">
                <Image
                  src="/api/logo"
                  alt="Adarsh Shipping logo"
                  width={430}
                  height={143}
                  className="mx-auto h-auto w-[220px] object-contain lg:mx-0 lg:w-[300px] opacity-90"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#008993]">
                  Appraisal Management Portal
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                  Performance.{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #008993, #00cec4)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Rewarded fairly.
                  </span>
                </h1>
                <p className="max-w-md text-muted-foreground sm:text-base leading-relaxed">
                  Access employee reviews, self-assessments, ratings, and appraisal workflows from one unified portal.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start text-sm">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#00cec4] inline-block" />
                  Self-assessments
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#008993] inline-block" />
                  360° Reviews
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#ffaa2d] inline-block" />
                  Salary insights
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[#ff8333] inline-block" />
                  Role-based access
                </span>
              </div>

              {/* Divider line */}
              <div
                className="hidden lg:block h-px w-48 opacity-30"
                style={{ background: "linear-gradient(90deg, #008993, transparent)" }}
              />
            </section>
          </FadeIn>

          {/* Right — form */}
          <FloatIn delay={0.18}>
            <section>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </section>
          </FloatIn>
        </div>
      </div>
    </div>
  );
}
