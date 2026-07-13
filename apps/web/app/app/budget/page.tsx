import { BudgetCalculator } from "@/components/budget-calculator";

export default function AppBudgetPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-navy-950">Budget runway</h1>
      <p className="mt-2 text-sm text-navy-800/70">
        Saved on this device — connect Supabase to sync across devices.
      </p>
      <div className="mt-8">
        <BudgetCalculator />
      </div>
    </div>
  );
}
