import { cn } from "@/lib/utils";

export const inputClass =
  "w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition";

export const selectClass = cn(inputClass, "cursor-pointer");

export const textareaClass = cn(inputClass, "min-h-[90px] resize-y");

export function FormField({
  label,
  children,
  hint,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[12.5px] font-medium text-ink-700 mb-1.5">
        {label}
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-ink-400 mt-1">{hint}</span>}
    </label>
  );
}

export function FormSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[14px] font-semibold text-ink-900">{title}</h3>
      {subtitle && <p className="text-[12px] text-ink-400 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
