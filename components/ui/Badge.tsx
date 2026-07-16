import type { ReactNode } from "react";

type Variante = "cyan" | "green" | "yellow" | "red" | "slate";

type Props = {
  children: ReactNode;
  variante?: Variante;
};

export default function Badge({
  children,
  variante = "slate",
}: Props) {
  const estilos = {
    cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
    green: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    yellow: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    red: "border-red-500/40 bg-red-500/15 text-red-200",
    slate: "border-slate-700 bg-slate-800 text-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${estilos[variante]}`}
    >
      {children}
    </span>
  );
}