"use client";

export function Field({
  id,
  label,
  icon,
  onChange,
  invalid,
  ...input
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
  invalid?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3">{icon}</span>
        <input
          id={id}
          name={id}
          {...input}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={invalid ? "auth-error" : undefined}
          className="h-12 w-full rounded-[10px] bg-white pl-10 pr-3 text-[16px] ring-1 ring-black/10 transition-shadow focus:outline-none focus:ring-2 focus:ring-octa-600"
        />
      </div>
    </div>
  );
}
