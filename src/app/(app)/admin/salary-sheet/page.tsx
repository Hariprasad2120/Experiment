import { FadeIn } from "@/components/motion-div";
import { SalaryCalculator } from "./salary-calculator";

export default function SalarySheetPage() {
  return (
    <div className="space-y-5">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Salary Structure Generator</h1>
          <p className="text-slate-500 text-sm mt-1">
            Auto-calculates PF, ESI, gratuity, PT, insurance, and take-home
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <SalaryCalculator />
      </FadeIn>
    </div>
  );
}
