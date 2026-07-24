import { supabase } from "@/lib/supabase";
import type {
  ClienteHistorial,
  HistorialCliente,
  MovimientoHistorial,
  ResumenHistorialCliente,
} from "@/types/historial-cliente";

type Registro = Record<string, unknown>;

type VisitaDB = Registro & {
  id: number;
  cliente_id?: number | null;
  cliente?: string | null;
  fecha_programada: string;
  fecha_realizada?: string | null;
  estado?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  resultado?: string | null;
  responsable?: string | null;
  proxima_visita?: string | null;
};

type CobroDB = Registro & {
  id: number;
  cliente_id?: number | null;
  cliente?: string | null;
  factura?: string | null;
  moneda: "UYU" | "USD";
  monto: number;
  fecha_programada: string;
  fecha_cobrado?: string | null;
  estado?: string | null;
  responsable?: string | null;
  observaciones?: string | null;
  forma_cobro?: string | null;
};

type EntregaDB = Registro & {
  id: number;
  cliente?: string | null;
  numero_factura?: string | null;
  fecha_pedido?: string | null;
  fecha_entrega_programada?: string | null;
  fecha_entregado?: string | null;
  fecha_entregado_real?: string | null;
  estado?: string | null;
  monto?: number | null;
  observaciones?: string | null;
  observacion_entrega?: string | null;
  recibido_por?: string | null;
};

const texto = (valor: unknown): string | null => {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio || null;
};

const numero = (valor: unknown): number => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};

const fechaValida = (fecha?: string | null): fecha is string =>
  Boolean(fecha && !Number.isNaN(new Date(fecha).getTime()));

const mismoNombre = (a?: string | null, b?: string | null) =>
  (a ?? "").trim().toLocaleLowerCase("es") ===
  (b ?? "").trim().toLocaleLowerCase("es");

function unirPorId<T extends { id: number }>(...listas: T[][]): T[] {
  return Array.from(
    new Map(listas.flat().map((registro) => [registro.id, registro])).values(),
  );
}

function estadoEsRealizado(estado?: string | null) {
  const valor = (estado ?? "").toLowerCase();
  return ["realizada", "entregado", "cobrado", "pagado"].includes(valor);
}

export async function obtenerHistorialCliente(
  clienteId: number,
): Promise<HistorialCliente> {
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    throw new Error("El identificador del cliente no es válido.");
  }

  // Se carga la lista y se resuelve el cliente localmente. Es más tolerante
  // con configuraciones RLS que permiten listar pero no usan .single().
  const { data: clientesData, error: clienteError } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  if (clienteError) {
    throw new Error(`No se pudo cargar el cliente: ${clienteError.message}`);
  }

  const clienteData = (clientesData ?? []).find(
    (item: Registro) => Number(item.id) === clienteId,
  );

  if (!clienteData) {
    throw new Error(
      "No se encontró ese cliente. Abrí el historial desde la pantalla Clientes para usar su identificador real.",
    );
  }

  const cliente: ClienteHistorial = {
    id: Number(clienteData.id),
    nombre: String(clienteData.nombre ?? "Cliente sin nombre"),
    direccion: texto(clienteData.direccion),
    departamento: texto(clienteData.departamento),
    telefono: texto(clienteData.telefono),
  };

  const [
    visitasIdResultado,
    visitasNombreResultado,
    cobrosIdResultado,
    cobrosNombreResultado,
    entregasResultado,
  ] = await Promise.all([
    supabase.from("visitas").select("*").eq("cliente_id", cliente.id),
    supabase.from("visitas").select("*").eq("cliente", cliente.nombre),
    supabase.from("cobros").select("*").eq("cliente_id", cliente.id),
    supabase.from("cobros").select("*").eq("cliente", cliente.nombre),
    supabase.from("entregas").select("*").eq("cliente", cliente.nombre),
  ]);

  const errores = [
    visitasIdResultado.error,
    visitasNombreResultado.error,
    cobrosIdResultado.error,
    cobrosNombreResultado.error,
    entregasResultado.error,
  ].filter(Boolean);

  if (errores.length > 0) {
    throw new Error(
      `No se pudo completar el historial: ${errores[0]?.message ?? "error desconocido"}`,
    );
  }

  const visitas = unirPorId(
    (visitasIdResultado.data ?? []) as VisitaDB[],
    (visitasNombreResultado.data ?? []).filter((item: Registro) =>
      mismoNombre(item.cliente, cliente.nombre),
    ) as VisitaDB[],
  );

  const cobros = unirPorId(
    (cobrosIdResultado.data ?? []) as CobroDB[],
    (cobrosNombreResultado.data ?? []).filter((item: Registro) =>
      mismoNombre(item.cliente, cliente.nombre),
    ) as CobroDB[],
  );

  const entregas = (entregasResultado.data ?? []).filter((item: Registro) =>
    mismoNombre(item.cliente, cliente.nombre),
  ) as EntregaDB[];

  const movimientos: MovimientoHistorial[] = [];

  visitas.forEach((visita) => {
    const fecha = visita.fecha_realizada ?? visita.fecha_programada;
    if (!fechaValida(fecha)) return;

    movimientos.push({
      id: `visita-${visita.id}`,
      referencia_id: visita.id,
      tipo: "visita",
      fecha,
      titulo: texto(visita.motivo) ?? "Visita comercial",
      descripcion:
        texto(visita.resultado) ??
        texto(visita.observaciones) ??
        "Sin observaciones registradas.",
      estado: texto(visita.estado) ?? "sin estado",
      responsable: texto(visita.responsable),
      monto: null,
      moneda: null,
      factura: null,
    });
  });

  cobros.forEach((cobro) => {
    const fecha = cobro.fecha_cobrado ?? cobro.fecha_programada;
    if (!fechaValida(fecha)) return;

    movimientos.push({
      id: `cobro-${cobro.id}`,
      referencia_id: cobro.id,
      tipo: "cobro",
      fecha,
      titulo: estadoEsRealizado(cobro.estado)
        ? "Cobro realizado"
        : "Cobro programado",
      descripcion:
        [texto(cobro.forma_cobro), texto(cobro.observaciones)]
          .filter(Boolean)
          .join(" · ") || null,
      estado: texto(cobro.estado) ?? "sin estado",
      responsable: texto(cobro.responsable),
      monto: numero(cobro.monto),
      moneda: cobro.moneda,
      factura: texto(cobro.factura),
    });
  });

  entregas.forEach((entrega) => {
    if (fechaValida(entrega.fecha_pedido)) {
      movimientos.push({
        id: `pedido-${entrega.id}`,
        referencia_id: entrega.id,
        tipo: "pedido",
        fecha: entrega.fecha_pedido,
        titulo: `Pedido ${texto(entrega.numero_factura) ?? "sin factura"}`,
        descripcion: texto(entrega.observaciones),
        estado: texto(entrega.estado) ?? "sin estado",
        responsable: null,
        monto: numero(entrega.monto),
        moneda: null,
        factura: texto(entrega.numero_factura),
      });
    }

    const fechaEntrega =
      entrega.fecha_entregado_real ??
      entrega.fecha_entregado ??
      entrega.fecha_entrega_programada;

    if (fechaValida(fechaEntrega)) {
      movimientos.push({
        id: `entrega-${entrega.id}`,
        referencia_id: entrega.id,
        tipo: "entrega",
        fecha: fechaEntrega,
        titulo: estadoEsRealizado(entrega.estado)
          ? "Entrega realizada"
          : "Entrega programada",
        descripcion:
          texto(entrega.observacion_entrega) ??
          texto(entrega.observaciones) ??
          (texto(entrega.recibido_por)
            ? `Recibido por ${texto(entrega.recibido_por)}`
            : null),
        estado: texto(entrega.estado) ?? "sin estado",
        responsable: null,
        monto: numero(entrega.monto),
        moneda: null,
        factura: texto(entrega.numero_factura),
      });
    }
  });

  const movimientosOrdenados = [...movimientos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  const visitasRealizadas = visitas
    .map((visita) => visita.fecha_realizada)
    .filter(fechaValida)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const hoy = new Date().setHours(0, 0, 0, 0);
  const proximasVisitas = visitas
    .map((visita) => visita.proxima_visita ?? visita.fecha_programada)
    .filter(fechaValida)
    .filter((fecha) => new Date(fecha).getTime() >= hoy)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const cobrosPendientes = cobros.filter(
    (cobro) => !estadoEsRealizado(cobro.estado),
  );

  const resumen: ResumenHistorialCliente = {
    visitas: visitas.length,
    pedidos: entregas.filter((entrega) => fechaValida(entrega.fecha_pedido)).length,
    entregas: entregas.filter(
      (entrega) =>
        estadoEsRealizado(entrega.estado) ||
        fechaValida(entrega.fecha_entregado_real) ||
        fechaValida(entrega.fecha_entregado),
    ).length,
    cobros: cobros.length,
    pendiente_uyu: cobrosPendientes
      .filter((cobro) => cobro.moneda === "UYU")
      .reduce((total, cobro) => total + numero(cobro.monto), 0),
    pendiente_usd: cobrosPendientes
      .filter((cobro) => cobro.moneda === "USD")
      .reduce((total, cobro) => total + numero(cobro.monto), 0),
    ultima_visita: visitasRealizadas[0] ?? null,
    proxima_visita: proximasVisitas[0] ?? null,
    ultimo_movimiento: movimientosOrdenados[0]?.fecha ?? null,
  };

  return { cliente, resumen, movimientos: movimientosOrdenados };
}
