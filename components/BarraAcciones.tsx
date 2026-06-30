import { EstadoEntrega } from "@/types/entrega";

type Props = {
  cantidadSeleccionada: number;
  onEditar: () => void;
  onEtiquetas: () => void;
  onCambiarEstado: (estado: EstadoEntrega) => void;
};

function Boton({
  texto,
  color,
  onClick,
}: {
  texto: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} hover:opacity-90 text-black font-bold px-4 py-2 rounded-xl`}
    >
      {texto}
    </button>
  );
}

export default function BarraAcciones({
  cantidadSeleccionada,
  onEditar,
  onEtiquetas,
  onCambiarEstado,
}: Props) {
  if (cantidadSeleccionada === 0) return null;

  return (
    <section className="bg-slate-900 border border-cyan-500 rounded-3xl p-5 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">Pedidos seleccionados</p>
          <h3 className="text-2xl font-bold">{cantidadSeleccionada}</h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {cantidadSeleccionada === 1 && (
            <Boton texto="✏️ Editar" color="bg-slate-500" onClick={onEditar} />
          )}

          <Boton texto="🏷️ Etiquetas" color="bg-purple-500" onClick={onEtiquetas} />
          <Boton texto="🚚 Reparto" color="bg-cyan-500" onClick={() => onCambiarEstado("a_entregar")} />
          <Boton texto="📦 Depósito" color="bg-yellow-500" onClick={() => onCambiarEstado("pendiente")} />
          <Boton texto="✅ Entregado" color="bg-emerald-500" onClick={() => onCambiarEstado("entregado")} />
          <Boton texto="🗑️ Papelera" color="bg-red-500" onClick={() => onCambiarEstado("papelera")} />
        </div>
      </div>
    </section>
  );
}