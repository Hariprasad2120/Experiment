import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { FadeIn, SlideIn } from "@/components/motion-div";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-4xl gap-12 lg:grid-cols-[1fr_440px] lg:items-center">
          <FadeIn delay={0.05}>
            <section className="space-y-7 text-center lg:text-left">
              <Image
                src="/api/logo"
                alt="Adarsh Shipping logo"
                width={430}
                height={143}
                className="mx-auto h-auto w-[240px] object-contain lg:mx-0 lg:w-[320px]"
              />
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
                  Appraisal Management Portal
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                  Performance.<br />Rewarded fairly.
                </h1>
                <p className="max-w-md text-slate-500 dark:text-slate-400 sm:text-base leading-relaxed">
                  Access employee reviews, self-assessments, ratings, and appraisal workflows from one unified portal.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-green-500 inline-block" />
                  Self-assessments
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-blue-500 inline-block" />
                  360° Reviews
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-purple-500 inline-block" />
                  Salary insights
                </span>
              </div>
            </section>
          </FadeIn>

          <SlideIn delay={0.15}>
            <section>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </section>
          </SlideIn>
        </div>
      </div>
    </div>
  );
}
