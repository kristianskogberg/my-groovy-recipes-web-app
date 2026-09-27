import type { ReactNode } from "react";

export default function InputField({
  label,
  name,
  icon,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  icon?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span className="inline-flex items-center gap-1.5">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
        {required && (
          <span className="text-primary" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </span>
      <input name={name} required={required} className="input" {...props} />
    </label>
  );
}
