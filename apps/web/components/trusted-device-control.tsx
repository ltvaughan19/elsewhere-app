interface TrustedDeviceControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TrustedDeviceControl({ checked, onChange }: TrustedDeviceControlProps) {
  return (
    <div className="mt-5 rounded-md border border-sand-200 bg-void-elevated/45 px-4 py-3">
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-cream">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-sand-300 accent-[var(--ea-accent-sand)]"
        />
        <span>Keep me signed in on this trusted device</span>
      </label>
      <p className="pl-7 text-xs leading-5 text-soft">
        Use only on a personal device. Otherwise your session ends when the browser session closes.
      </p>
    </div>
  );
}
