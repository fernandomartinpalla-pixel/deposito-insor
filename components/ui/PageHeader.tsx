import type { ReactNode } from "react";

type Props = {
  etiqueta?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
};

export default function PageHeader({
  etiqueta,
  titulo,
  descripcion,
  acciones,
}: Props) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {etiqueta && (
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
            {etiqueta}
          </p>
        )}

        <h1 className="mt-2 text-4xl font-black text-white lg:text-5xl">
          {titulo}
        </h1>

        {descripcion && (
          <p className="mt-3 max-w-2xl text-slate-400">
            {descripcion}
          </p>
        )}
      </div>

      {acciones && <div>{acciones}</div>}
    </div>
  );
}