import type { Cliente } from "@/types/cliente";
import type {
  PrioridadEntrega,
  TipoEntrega,
} from "@/types/entrega";

type Props = {
  clientes: Cliente[];

  cliente: string;
  fechaPedido: string;
  fechaEntrega: string;
  factura: string;
  monto: string;
  observaciones: string;
  prioridad: PrioridadEntrega;
  tipoEntrega: TipoEntrega;
  telefono: string;
  direccion: string;
  departamento: string;

  onClienteChange: (valor: string) => void;
  setFechaPedido: (valor: string) => void;
  setFechaEntrega: (valor: string) => void;
  setFactura: (valor: string) => void;
  setMonto: (valor: string) => void;
  setObservaciones: (valor: string) => void;
  setPrioridad: (valor: PrioridadEntrega) => void;
  setTipoEntrega: (valor: TipoEntrega) => void;
  setTelefono: (valor: string) => void;
  setDireccion: (valor: string) => void;
  setDepartamento: (valor: string) => void;

  onGuardar: () => void;
};

export default function FormularioPedido({
  clientes,
  cliente,
  fechaPedido,
  fechaEntrega,
  factura,
  monto,
  observaciones,
  prioridad,
  tipoEntrega,
  telefono,
  direccion,
  departamento,
  onClienteChange,
  setFechaPedido,
  setFechaEntrega,
  setFactura,
  setMonto,
  setObservaciones,
  setPrioridad,
  setTipoEntrega,
  setTelefono,
  setDireccion,
  setDepartamento,
  onGuardar,
}: Props) {
  const esRetiro = tipoEntrega === "retiro";

  function seleccionarTipoEntrega(valor: TipoEntrega) {
    setTipoEntrega(valor);

    if (valor === "retiro") {
      setFechaEntrega("");
    }

    if (valor === "domicilio" && !fechaEntrega) {
      setFechaEntrega(new Date().toISOString().slice(0, 10));
    }
  }

  return (
    <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <datalist id="clientes-list">
        {clientes.map((c) => (
          <option key={c.id} value={c.nombre} />
        ))}
      </datalist>

      <h3 className="mb-6 text-2xl font-bold">➕ Nuevo pedido</h3>

      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold text-slate-300">
          Tipo de pedido
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => seleccionarTipoEntrega("domicilio")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              tipoEntrega === "domicilio"
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
            }`}
          >
            <span className="block text-lg font-bold">
              🚚 Entrega a domicilio
            </span>

            <span className="mt-1 block text-sm text-slate-400">
              El pedido se envía a la dirección del cliente.
            </span>
          </button>

          <button
            type="button"
            onClick={() => seleccionarTipoEntrega("retiro")}
            className={`rounded-2xl border px-5 py-4 text-left transition ${
              tipoEntrega === "retiro"
                ? "border-amber-400 bg-amber-500/20 text-amber-100"
                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
            }`}
          >
            <span className="block text-lg font-bold">
              🏪 Retira el cliente
            </span>

            <span className="mt-1 block text-sm text-slate-400">
              El pedido queda pronto en el depósito para retirar.
            </span>
          </button>
        </div>
      </div>

      {esRetiro && (
        <div className="mb-5 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-5 py-4 text-amber-100">
          <p className="font-bold">🏪 Pedido para retirar</p>

          <p className="mt-1 text-sm text-amber-100/80">
            Este pedido no necesita fecha de entrega y no será considerado
            vencido.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Campo>
          <Etiqueta>Cliente</Etiqueta>

          <Input
            placeholder="Nombre del cliente"
            value={cliente}
            onChange={onClienteChange}
            list="clientes-list"
          />
        </Campo>

        <Campo>
          <Etiqueta>Número de factura</Etiqueta>

          <Input
            placeholder="Número de factura"
            value={factura}
            onChange={setFactura}
          />
        </Campo>

        <Campo>
          <Etiqueta>Monto USD</Etiqueta>

          <Input
            type="number"
            placeholder="Monto USD"
            value={monto}
            onChange={setMonto}
          />
        </Campo>

        <Campo>
          <Etiqueta>Fecha del pedido</Etiqueta>

          <Input
            type="date"
            value={fechaPedido}
            onChange={setFechaPedido}
          />
        </Campo>

        {!esRetiro && (
          <Campo>
            <Etiqueta>Fecha de entrega</Etiqueta>

            <Input
              type="date"
              value={fechaEntrega}
              onChange={setFechaEntrega}
            />
          </Campo>
        )}

        <Campo>
          <Etiqueta>Prioridad</Etiqueta>

          <select
            value={prioridad}
            onChange={(e) =>
              setPrioridad(e.target.value as PrioridadEntrega)
            }
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4"
          >
            <option value="normal">Prioridad normal</option>
            <option value="urgente">Urgente</option>
            <option value="critico">Crítico</option>
          </select>
        </Campo>

        <Campo>
          <Etiqueta>Teléfono</Etiqueta>

          <Input
            placeholder="Teléfono"
            value={telefono}
            onChange={setTelefono}
          />
        </Campo>

        <Campo>
          <Etiqueta>
            {esRetiro ? "Dirección del cliente (opcional)" : "Dirección"}
          </Etiqueta>

          <Input
            placeholder={
              esRetiro
                ? "Dirección opcional"
                : "Dirección de entrega"
            }
            value={direccion}
            onChange={setDireccion}
          />
        </Campo>

        <Campo>
          <Etiqueta>Departamento</Etiqueta>

          <Input
            placeholder="Departamento"
            value={departamento}
            onChange={setDepartamento}
          />
        </Campo>
      </div>

      <div className="mt-5">
        <Etiqueta>Observaciones</Etiqueta>

        <textarea
          placeholder="Observaciones del pedido"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="mt-2 h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 p-5"
        />
      </div>

      <button
        type="button"
        onClick={onGuardar}
        className="mt-5 rounded-2xl bg-cyan-500 px-6 py-4 font-bold text-black hover:bg-cyan-400"
      >
        Guardar pedido
      </button>
    </section>
  );
}

function Campo({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-slate-300">
      {children}
    </label>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  list,
}: {
  placeholder?: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  list?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      list={list}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4"
    />
  );
}