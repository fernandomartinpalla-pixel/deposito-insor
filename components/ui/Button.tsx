"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primary" | "success" | "danger" | "secondary";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variante?: Variante;
  anchoCompleto?: boolean;
};

export default function Button({
  children,
  variante = "primary",
  anchoCompleto = false,
  className = "",
  ...props
}: Props) {
  const estilos = {
    primary:
      "bg-cyan-500 text-slate-950 hover:bg-cyan-400 border-cyan-400",
    success:
      "bg-emerald-500 text-emerald-950 hover:bg-emerald-400 border-emerald-400",
    danger:
      "bg-red-500 text-white hover:bg-red-400 border-red-400",
    secondary:
      "bg-slate-800 text-white hover:bg-slate-700 border-slate-700",
  };

  return (
    <button
      {...props}
      className={`rounded-2xl border px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        estilos[variante]
      } ${anchoCompleto ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}