import { Entrega } from "@/types/entrega";
import TablaPedidos from "./TablaPedidos";

type Props = {
  titulo: string;
  descripcion?: string;
  entregas: Entrega[];
  seleccionados: number[];
  onSeleccionar: (id: number) => void;
onEditar: (entrega: Entrega) => void;
onImprimirEtiqueta: (entrega: Entrega) => void;
onCambiarEstadoPedido?: (
  id: number,
  estado: "pendiente" | "a_entregar" | "entregado" | "papelera"
) => void;
};


export default function SeccionPedidos({
  titulo,
  descripcion,
  entregas,
  seleccionados,
  onSeleccionar,
  onEditar,
  onImprimirEtiqueta,
  onCambiarEstadoPedido,
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">{titulo}</h2>

        {descripcion && (
          <p className="mt-1 text-sm text-slate-400">{descripcion}</p>
        )}
      </div>

<TablaPedidos
  entregas={entregas}
  seleccionados={seleccionados}
  onSeleccionar={onSeleccionar}
  onEditar={onEditar}
  onImprimirEtiqueta={onImprimirEtiqueta}
  onCambiarEstadoPedido={onCambiarEstadoPedido}
/>
    </section>
  );
}