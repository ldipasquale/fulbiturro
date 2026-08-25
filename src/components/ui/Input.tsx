import clsx from "clsx";
import { InputHTMLAttributes } from "react";

const fieldClass =
  "rounded-lg border border-white/10 bg-pitch-dark px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/50 focus:ring-2 focus:ring-gold/20";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <input id={inputId} className={clsx(fieldClass, className)} {...props} />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <select id={selectId} className={clsx(fieldClass, className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-pitch-dark text-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
