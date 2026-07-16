import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}