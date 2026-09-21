"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function Alert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null;
  return (
    <p
      role="status"
      className={`rounded-[10px] px-3 py-2 text-[13px] font-medium ${
        error ? "bg-danger/10 text-danger" : "bg-mist text-pine"
      }`}
    >
      {error ?? message}
    </p>
  );
}
