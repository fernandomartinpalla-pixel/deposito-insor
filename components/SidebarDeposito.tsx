"use client";

type Props = {
  email?: string | null;
  enReparto: number;
  prontosDeposito: number;
  historial: number;
  papelera: number;
  clientes: number;
  onLogout: () => void;
};

export default function SidebarDeposito({
  email,
  enReparto,
  prontosDeposito,
  historial,
  papelera,
  clientes,
  onLogout,
}: Props) {
  return (
    <aside className="w-72 min-h-screen bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center text-2xl font-black mb-4">
            I
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            INSOR
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Sistema de depósito
          </p>
        </div>

        <nav className="space-y-3">
          <Item icono="📦" texto="Dashboard" activo />

          <Separador />

          <Item icono="🚚" texto="En reparto" valor={enReparto} color="cyan" />
          <Item
            icono="📥"
            texto="En depósito"
            valor={prontosDeposito}
            color="yellow"
          />
          <Item
            icono="✅"
            texto="Entregados"
            valor={historial}
            color="green"
          />
          <Item icono="🗑️" texto="Papelera" valor={papelera} color="red" />
          <Item icono="👥" texto="Clientes" valor={clientes} color="purple" />

          <Separador />

          <Item icono="🚛" texto="Choferes" deshabilitado />
          <Item icono="🗺️" texto="Mapa" deshabilitado />
          <Item icono="📈" texto="Reportes" deshabilitado />
          <Item icono="⚙️" texto="Configuración" deshabilitado />
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-5">
        <p className="text-xs text-slate-500 mb-1">Usuario conectado</p>

        <p className="text-sm text-slate-300 break-all">
          {email || "Sin usuario"}
        </p>

        <button
          onClick={onLogout}
          className="mt-4 w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function Separador() {
  return <div className="h-px bg-slate-800 my-4" />;
}

function Item({
  icono,
  texto,
  valor,
  activo = false,
  deshabilitado = false,
  color = "slate",
}: {
  icono: string;
  texto: string;
  valor?: number;
  activo?: boolean;
  deshabilitado?: boolean;
  color?: "cyan" | "yellow" | "green" | "red" | "purple" | "slate";
}) {
  const colorClase =
    color === "cyan"
      ? "bg-cyan-500 text-slate-950"
      : color === "yellow"
      ? "bg-yellow-500 text-slate-950"
      : color === "green"
      ? "bg-emerald-500 text-slate-950"
      : color === "red"
      ? "bg-red-500 text-white"
      : color === "purple"
      ? "bg-purple-500 text-white"
      : "bg-slate-700 text-white";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${
        activo
          ? "bg-cyan-500/15 border border-cyan-500 text-cyan-100"
          : deshabilitado
          ? "text-slate-600"
          : "text-slate-300 hover:bg-slate-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icono}</span>
        <span className="text-sm font-medium">{texto}</span>
      </div>

      {typeof valor === "number" && (
        <span
          className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-black ${colorClase}`}
        >
          {valor}
        </span>
      )}

      {deshabilitado && (
        <span className="text-[10px] uppercase tracking-widest text-slate-600">
          pronto
        </span>
      )}
    </div>
  );
}