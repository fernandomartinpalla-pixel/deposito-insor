export type TipoMovimientoHistorial = "visita" | "pedido" | "entrega" | "cobro";

export type ClienteHistorial = {
  id: number;
  nombre: string;
  direccion: string | null;
  departamento: string | null;
  telefono: string | null;
};

export type MovimientoHistorial = {
  id: string;
  referencia_id: number;
  tipo: TipoMovimientoHistorial;
  fecha: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  responsable: string | null;
  monto: number | null;
  moneda: "UYU" | "USD" | null;
  factura: string | null;
};

export type ResumenHistorialCliente = {
  visitas: number;
  pedidos: number;
  entregas: number;
  cobros: number;
  pendiente_uyu: number;
  pendiente_usd: number;
  ultima_visita: string | null;
  proxima_visita: string | null;
  ultimo_movimiento: string | null;
};

export type HistorialCliente = {
  cliente: ClienteHistorial;
  resumen: ResumenHistorialCliente;
  movimientos: MovimientoHistorial[];
};
