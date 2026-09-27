export default function TextAreaField({
  label,
  name,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>
        {label}
        {required && (
          <span className="text-primary" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </span>
      <textarea
        name={name}
        required={required}
        rows={4}
        className="input"
        {...props}
      />
    </label>
  );
}
