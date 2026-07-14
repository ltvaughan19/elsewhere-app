export function TrustDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={`text-sm leading-relaxed text-navy-800 ${className ?? ""}`}
      role="note"
    >
      General planning information only. Always verify legal, visa, tax,
      insurance, and property decisions with official sources or licensed
      professionals.
    </p>
  );
}
