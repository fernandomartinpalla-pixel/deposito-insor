import { Cliente } from "@/types/cliente";
import { PrioridadEntrega } from "@/types/entrega";

type Props = {
  clientes: Cliente[];

  cliente: string;
  fechaPedido: string;
  fechaEntrega: string;
  factura: string;
  monto: string;
  observaciones: string;
  prioridad: PrioridadEntrega;
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
  setTelefono,
  setDireccion,
  setDepartamento,
  onGuardar,
}: Props) {
  return (
    <section className="bg-slate-900 rounded-3xl border border-slate-800 p-4 mb-10">
      <datalist id="clientes-list">
        {clientes.map((c) => (
          <option key={c.id} value={c.nombre} />
        ))}
      </datalist>

      <h3 className="text-2xl font-bold mb-6">➕ Nuevo pedido</h3>

      <div className="grid lg:grid-cols-3 gap-5">
        <Input
          placeholder="Cliente"
          value={cliente}
          onChange={onClienteChange}
          list="clientes-list"
        />

        <Input
          placeholder="Número factura"
          value={factura}
          onChange={setFactura}
        />

        <Input
          type="number"
          placeholder="Monto USD"
          value={monto}
          onChange={setMonto}
        />

        <Input type="date" value={fechaPedido} onChange={setFechaPedido} />

        <Input type="date" value={fechaEntrega} onChange={setFechaEntrega} />

        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value as PrioridadEntrega)}
          className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 w-full"
        >
          <option value="normal">Prioridad normal</option>
          <option value="urgente">Urgente</option>
          <option value="critico">Crítico</option>
        </select>

        <Input placeholder="Teléfono" value={telefono} onChange={setTelefono} />

        <Input
          placeholder="Dirección"
          value={direccion}
          onChange={setDireccion}
        />

        <Input
          placeholder="Departamento"
          value={departamento}
          onChange={setDepartamento}
        />
      </div>

      <textarea
        placeholder="Observaciones"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        className="w-full mt-5 bg-slate-950 border border-slate-700 rounded-2xl p-5 h-32"
      />

      <button
        onClick={onGuardar}
        className="mt-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-4 rounded-2xl"
      >
        Guardar pedido
      </button>
    </section>
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
  onChange: (v: string) => void;
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
      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 w-full"
    />
  );
}