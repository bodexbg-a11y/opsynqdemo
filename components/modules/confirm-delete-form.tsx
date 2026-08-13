"use client";

import type { ReactNode } from "react";

export function ConfirmDeleteForm({
  action,
  fields,
  confirmMessage,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </form>
  );
}
