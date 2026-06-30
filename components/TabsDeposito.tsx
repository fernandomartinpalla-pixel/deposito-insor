"use client";

export type TabDeposito = "reparto" | "deposito" | "historial" | "papelera";

type Props = {
  activa: TabDeposito;
  onCambiar: (tab: TabDeposito) => void;
  reparto: number;
  deposito: number;
  historial: number;
  papelera: number;
};

export default function TabsDeposito({
  activa,
  onCambiar,
  reparto,
  deposito,
  historial,
  papelera,
}: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tab
        activa={activa === "reparto"}
        icono="🚚"
        texto="Reparto"
        valor={reparto}
        onClick={() => onCambiar("reparto")}
      />

      <Tab
        activa={activa === "deposito"}
        icono="📦"
        texto="Depósito"
        valor={deposito}
        onClick={() => onCambiar("deposito")}
      />

      <Tab
        activa={activa === "historial"}
        icono="✅"
        texto="Historial"
        valor={historial}
        onClick={() => onCambiar("historial")}
      />

      <Tab
        activa={activa === "papelera"}
        icono="🗑️"
        texto="Papelera"
        valor={papelera}
        onClick={() => onCambiar("papelera")}
      />
    </div>
  );
}

function Tab({
  activa,
  icono,
  texto,
  valor,
  onClick,
}: {
  activa: boolean;
  icono: string;
  texto: string;
  valor: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        activa
          ? "border-cyan-500 bg-cyan-500/15 text-white shadow-xl"
          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xl">{icono}</span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            activa
              ? "bg-cyan-500 text-slate-950"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {valor}
        </span>
      </div>

      <p className="text-sm font-bold">{texto}</p>
    </button>
  );
}