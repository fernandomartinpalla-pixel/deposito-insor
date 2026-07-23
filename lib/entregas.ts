import { supabase } from "@/lib/supabase";
import {
  Entrega,
  EstadoEntrega,
  TipoEntrega,
} from "@/types/entrega";

export type FiltroHistorial =
  | "ultimos5"
  | "esteMes"
  | "porMes"
  | "todas";

export function normalizarEntregas(data: any[]): Entrega[] {
  return (data || []).map((e) => ({
    ...e,
    estado: e.estado || "pendiente",
    prioridad: e.prioridad || "normal",
    tipo_entrega: e.tipo_entrega || "domicilio",
  })) as Entrega[];
}

export function proximoMes(mes: string) {
  const [anio, mesNum] = mes.split("-").map(Number);
  const fecha = new Date(anio, mesNum, 1);

  return fecha.toISOString().slice(0, 10);
}

export async function cargarPedidosEnReparto(): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .eq("estado", "a_entregar")
    .order("fecha_entrega_programada", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) throw error;

  return normalizarEntregas(data || []);
}

export async function cargarPedidosProntosDeposito(): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .eq("estado", "pendiente")
    .order("fecha_entrega_programada", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) throw error;

  return normalizarEntregas(data || []);
}

export async function cargarPapelera(): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .eq("estado", "papelera")
    .order("id", { ascending: false })
    .limit(500);

  if (error) throw error;

  return normalizarEntregas(data || []);
}

export async function cargarHistorial(params: {
  filtro: FiltroHistorial;
  mesSeleccionado: string;
}): Promise<Entrega[]> {
  let query = supabase
    .from("entregas")
    .select("*")
    .eq("estado", "entregado")
    .order("fecha_entregado", { ascending: false });

  if (params.filtro === "ultimos5") {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 4);

    query = query.gte(
      "fecha_entregado",
      fechaLimite.toISOString().slice(0, 10)
    );
  }

  if (params.filtro === "esteMes") {
    const mesActual = new Date().toISOString().slice(0, 7);

    query = query
      .gte("fecha_entregado", `${mesActual}-01`)
      .lt("fecha_entregado", proximoMes(mesActual));
  }

  if (params.filtro === "porMes") {
    query = query
      .gte(
        "fecha_entregado",
        `${params.mesSeleccionado}-01`
      )
      .lt(
        "fecha_entregado",
        proximoMes(params.mesSeleccionado)
      );
  }

  if (params.filtro === "todas") {
    query = query.limit(500);
  }

  const { data, error } = await query;

  if (error) throw error;

  return normalizarEntregas(data || []);
}

export async function guardarEntrega(params: {
  cliente: string;
  fechaPedido: string;
  fechaEntrega: string;
  factura: string;
  monto: string;
  observaciones: string;
  prioridad: string;
  telefono: string;
  direccion: string;
  departamento: string;
  tipoEntrega: TipoEntrega;
}) {
  const esRetiro = params.tipoEntrega === "retiro";

  const { error } = await supabase
    .from("entregas")
    .insert([
      {
        cliente: params.cliente.trim(),

        fecha_pedido: params.fechaPedido,

        fecha_entrega_programada: esRetiro
          ? null
          : params.fechaEntrega || null,

        fecha_entregado: null,
        fecha_entregado_real: null,

        tipo_entrega: params.tipoEntrega,

        numero_factura: params.factura.trim(),
        monto: Number(params.monto),

        observaciones: params.observaciones.trim(),

        prioridad: params.prioridad,

        telefono_cliente: params.telefono.trim(),
        direccion: params.direccion.trim(),
        departamento: params.departamento.trim(),

        estado: "pendiente",

        qr_token: crypto.randomUUID(),
      },
    ]);

  if (error) throw error;
}

export async function actualizarEntrega(pedido: Entrega) {
  const tipoEntrega =
    pedido.tipo_entrega || "domicilio";

  const esRetiro = tipoEntrega === "retiro";

  const { error } = await supabase
    .from("entregas")
    .update({
      cliente: pedido.cliente,

      fecha_pedido: pedido.fecha_pedido,

      fecha_entrega_programada: esRetiro
        ? null
        : pedido.fecha_entrega_programada || null,

      tipo_entrega: tipoEntrega,

      numero_factura: pedido.numero_factura,

      monto: Number(pedido.monto),

      observaciones: pedido.observaciones,

      prioridad: pedido.prioridad || "normal",

      telefono_cliente: pedido.telefono_cliente,

      direccion: pedido.direccion,

      departamento: pedido.departamento,
    })
    .eq("id", pedido.id);

  if (error) throw error;
}

export async function cambiarEstadoPedidos(
  ids: number[],
  estado: EstadoEntrega
) {
  const updateData: Partial<Entrega> = {
    estado,
  };

  const ahora = new Date().toISOString();

  if (estado === "entregado") {
    updateData.fecha_entregado = ahora;
    updateData.fecha_entregado_real = ahora;
  }

  if (
    estado === "pendiente" ||
    estado === "a_entregar"
  ) {
    updateData.fecha_entregado = null;
    updateData.fecha_entregado_real = null;
  }

  const { error } = await supabase
    .from("entregas")
    .update(updateData)
    .in("id", ids);

  if (error) throw error;
}

export function filtrarPedidos(
  lista: Entrega[],
  texto: string
) {
  const t = texto.toLowerCase().trim();

  if (!t) return lista;

  return lista.filter(
    (e) =>
      e.cliente?.toLowerCase().includes(t) ||
      e.numero_factura?.toLowerCase().includes(t) ||
      e.telefono_cliente?.toLowerCase().includes(t) ||
      e.direccion?.toLowerCase().includes(t) ||
      e.departamento?.toLowerCase().includes(t) ||
      e.tipo_entrega?.toLowerCase().includes(t)
  );
}