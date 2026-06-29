import { BudgetCalculator } from "@/components/budget-calculator";

export default function BudgetCalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy-950">Budget & runway calculator</h1>
      <p className="mt-4 max-w-2xl text-navy-800/80">
        Estimate monthly burn, savings runway, and whether you are lean-but-possible
        or not ready yet. This is a planning estimate — not financial advice.
      </p>
      <div className="mt-10">
        <BudgetCalculator />
      </div>
    </div>
  );
}
