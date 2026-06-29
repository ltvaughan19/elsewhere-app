export function TrustDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={`text-sm text-navy-800/70 ${className ?? ""}`}
      role="note"
    >
      General planning information only. Always verify legal, visa, tax,
      insurance, and property decisions with official sources or licensed
      professionals.
    </p>
  );
}
