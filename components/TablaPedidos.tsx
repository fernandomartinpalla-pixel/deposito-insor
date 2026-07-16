import { Entrega, EstadoEntrega, PrioridadEntrega } from "@/types/entrega";
import { fechaUY, usd } from "@/lib/formato";

type Props = {
  entregas: Entrega[];
  seleccionados: number[];
  onSeleccionar: (id: number) => void;

  onEditar: (pedido: Entrega) => void;
  onImprimirEtiqueta: (pedido: Entrega) => void;
  onCambiarEstadoPedido?: (id: number, estado: EstadoEntrega) => void;
};

export default function TablaPedidos({
  entregas,
  seleccionados,
  onSeleccionar,
  onEditar,
  onImprimirEtiqueta,
  onCambiarEstadoPedido,
}: Props) {
  if (entregas.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
        No hay pedidos para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entregas.map((e) => (
        <article
          key={e.id}
          className={`rounded-3xl border p-5 transition-all duration-200 ${
            seleccionados.includes(e.id)
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/60"
          }`}
        >
          <div className="flex gap-5">
            <div className="pt-2">
              <input
                type="checkbox"
                checked={seleccionados.includes(e.id)}
                onChange={() => onSeleccionar(e.id)}
                className="h-5 w-5 accent-cyan-500"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-1g font-bold text-white">
                      {e.cliente}
                    </h3>

                    <Prioridad prioridad={e.prioridad ?? undefined} />
                    <Estado estado={e.estado} />
                  </div>

                  <div className="mt-3 grid gap-x-10 gap-y-2 text-sm md:grid-cols-2">
                    <Dato icono="📄" titulo="Factura" valor={e.numero_factura} />

                    <Dato
                      icono="📅"
                      titulo="Entrega"
                      valor={fechaUY(
                        e.fecha_entrega_programada || e.fecha_entregado
                      )}
                    />

                    <Dato icono="💵" titulo="Monto" valor={usd(e.monto)} />

                    <Dato
                      icono="☎"
                      titulo="Teléfono"
                      valor={e.telefono_cliente || "-"}
                    />

                    <Dato
                      icono="📍"
                      titulo="Dirección"
                      valor={e.direccion || "-"}
                    />

                    <Dato
                      icono="🗺"
                      titulo="Departamento"
                      valor={e.departamento || "-"}
                    />
                  </div>

                  {e.observaciones && (
                    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-cyan-200">
                      📝 {e.observaciones}
                    </div>
                  )}
                </div>

                <div className="flex min-w-[170px] flex-col gap-2">
                  <Boton texto="✏ Editar" onClick={() => onEditar(e)} />

                  <Boton
                    texto="🏷 Etiqueta"
                    onClick={() => onImprimirEtiqueta(e)}
                  />

                  {onCambiarEstadoPedido && e.estado !== "a_entregar" && (
                    <Boton
                      texto="🚚 Reparto"
                      variante="cyan"
                      onClick={() => onCambiarEstadoPedido(e.id, "a_entregar")}
                    />
                  )}

                  {onCambiarEstadoPedido && e.estado !== "entregado" && (
                    <Boton
                      texto="✅ Entregado"
                      variante="green"
                      onClick={() => onCambiarEstadoPedido(e.id, "entregado")}
                    />
                  )}

                  {e.telefono_cliente && (
                    <a
                      href={`tel:${e.telefono_cliente}`}
                      className="rounded-xl bg-slate-800 py-2 text-center text-sm font-semibold hover:bg-slate-700"
                    >
                      ☎ Llamar
                    </a>
                  )}

                  {e.direccion && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${e.direccion} ${e.departamento ?? ""}`
                      )}`}
                      className="rounded-xl bg-slate-800 py-2 text-center text-sm font-semibold hover:bg-slate-700"
                    >
                      📍 Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Dato({
  icono,
  titulo,
  valor,
}: {
  icono: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {icono} {titulo}
      </div>

      <div className="font-medium text-slate-200">{valor}</div>
    </div>
  );
}

function Boton({
  texto,
  onClick,
  variante = "slate",
}: {
  texto: string;
  onClick?: () => void;
  variante?: "slate" | "cyan" | "green";
}) {
  const clase =
    variante === "cyan"
      ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
      : variante === "green"
      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      : "bg-slate-800 text-white hover:bg-cyan-600";

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${clase}`}
    >
      {texto}
    </button>
  );
}

function Prioridad({ prioridad }: { prioridad?: PrioridadEntrega | null }) {
  if (prioridad === "critico") {
    return (
      <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
        🔴 CRÍTICO
      </span>
    );
  }

  if (prioridad === "urgente") {
    return (
      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
        🟡 URGENTE
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-bold text-white">
      ⚪ NORMAL
    </span>
  );
}

function Estado({ estado }: { estado?: EstadoEntrega | null }) {
  if (estado === "a_entregar") {
    return (
      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
        🚚 REPARTO
      </span>
    );
  }

  if (estado === "entregado") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
        ✅ ENTREGADO
      </span>
    );
  }

  if (estado === "papelera") {
    return (
      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
        🗑 PAPELERA
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300">
      📦 DEPÓSITO
    </span>
  );
}