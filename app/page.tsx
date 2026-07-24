"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import { cargarCobros } from "@/lib/cobros";
import {
  cargarPedidosEnReparto,
  cargarPedidosProntosDeposito,
} from "@/lib/entregas";
import { cargarVisitas } from "@/lib/visitas";

type Registro = Record<string, any>;
type Tono = "cyan" | "emerald" | "amber" | "rose" | "blue";

export default function Home() {
  const [entregas, setEntregas] = useState<Registro[]>([]);
  const [pedidosEnDeposito, setPedidosEnDeposito] = useState<Registro[]>([]);
  const [pedidosEnReparto, setPedidosEnReparto] = useState<Registro[]>([]);
  const [cobros, setCobros] = useState<Registro[]>([]);
  const [visitas, setVisitas] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarResumen();
  }, []);

  async function cargarResumen() {
    try {
      setCargando(true);

      const [enReparto, enDeposito, listaCobros, listaVisitas] =
        await Promise.all([
          cargarPedidosEnReparto(),
          cargarPedidosProntosDeposito(),
          cargarCobros(),
          cargarVisitas(),
        ]);

      setPedidosEnReparto(enReparto || []);
      setPedidosEnDeposito(enDeposito || []);
      setEntregas([...(enReparto || []), ...(enDeposito || [])]);
      setCobros(listaCobros || []);
      setVisitas(listaVisitas || []);
    } catch (error) {
      console.error("No se pudo cargar el resumen del dashboard:", error);
    } finally {
      setCargando(false);
    }
  }

  const hoy = fechaLocalISO();

  const resumen = useMemo(() => {
    const entregasHoy = entregas.filter((item) => {
      const fecha = obtenerFecha(item, [
        "fecha_entrega_programada",
        "fecha_entrega",
      ]);

      return fecha === hoy && item.estado !== "entregado";
    });

    const entregasEnDeposito = pedidosEnDeposito;
    const entregasEnReparto = pedidosEnReparto;

    const entregadasHoy = entregas.filter((item) => {
      const fecha = obtenerFecha(item, [
        "fecha_entregado_real",
        "fecha_entregado",
        "updated_at",
      ]);

      return fecha === hoy && item.estado === "entregado";
    });

    const cobrosHoy = cobros.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);
      return fecha === hoy && item.estado === "pendiente";
    });

    const visitasHoy = visitas.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return (
        fecha === hoy &&
        item.estado !== "realizada" &&
        item.estado !== "cancelada"
      );
    });

    const entregasVencidas = entregas.filter((item) => {
      const fecha = obtenerFecha(item, [
        "fecha_entrega_programada",
        "fecha_entrega",
      ]);

      return Boolean(
        fecha &&
          fecha < hoy &&
          item.estado !== "entregado" &&
          item.tipo_entrega !== "retiro"
      );
    });

    const cobrosVencidos = cobros.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);
      return Boolean(fecha && fecha < hoy && item.estado === "pendiente");
    });

    const visitasVencidas = visitas.filter((item) => {
      const fecha = obtenerFecha(item, ["fecha_programada"]);

      return Boolean(
        fecha &&
          fecha < hoy &&
          item.estado !== "realizada" &&
          item.estado !== "cancelada"
      );
    });

    const totalCobrosUYU = cobrosHoy
      .filter((item) => item.moneda === "UYU")
      .reduce((total, item) => total + Number(item.monto || 0), 0);

    const totalCobrosUSD = cobrosHoy
      .filter((item) => item.moneda === "USD")
      .reduce((total, item) => total + Number(item.monto || 0), 0);

    return {
      entregasHoy,
      entregasEnDeposito,
      entregasEnReparto,
      entregadasHoy,
      cobrosHoy,
      visitasHoy,
      entregasVencidas,
      cobrosVencidos,
      visitasVencidas,
      vencidos:
        entregasVencidas.length +
        cobrosVencidos.length +
        visitasVencidas.length,
      totalCobrosUYU,
      totalCobrosUSD,
    };
  }, [entregas, pedidosEnDeposito, pedidosEnReparto, cobros, visitas, hoy]);

  const saludo = obtenerSaludo();
  const fechaBonita = formatearFechaLarga(new Date());

  return (
    <LayoutOperaciones titulo="Dashboard">
      <main className="min-h-screen bg-slate-950 p-3 text-white sm:p-4 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-end">
  <button
    type="button"
    onClick={cargarResumen}
    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-cyan-400 hover:text-white"
  >
    ↻ Actualizar
  </button>
</div>

          <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              href="/entregas"
              icono="📦"
              titulo="Entregas"
              valor={cargando ? "..." : String(resumen.entregasHoy.length)}
              detalle="programadas para hoy"
              tono="cyan"
            />

            <Indicador
              href="/cobros"
              icono="💰"
              titulo="Cobros"
              valor={cargando ? "..." : String(resumen.cobrosHoy.length)}
              detalle="pendientes para hoy"
              tono="emerald"
            />

            <Indicador
              href="/visitas"
              icono="👤"
              titulo="Visitas"
              valor={cargando ? "..." : String(resumen.visitasHoy.length)}
              detalle="en la agenda de hoy"
              tono="amber"
            />

            <Indicador
              href="/reportes"
              icono="⚠️"
              titulo="Alertas"
              valor={cargando ? "..." : String(resumen.vencidos)}
              detalle="tareas que requieren atención"
              tono="rose"
            />
          </section>

          <section className="mb-7 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <PanelOperativo resumen={resumen} cargando={cargando} />
            <PanelAlertas resumen={resumen} cargando={cargando} />
          </section>

          <section className="mb-7">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Acciones rápidas
                </p>
                <h2 className="mt-2 text-2xl font-black">Empezar una tarea</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AccionRapida
                href="/entregas"
                icono="＋"
                titulo="Nuevo pedido"
                detalle="Registrar una entrega o un retiro"
                tono="cyan"
              />

              <AccionRapida
                href="/visitas"
                icono="👤"
                titulo="Nueva visita"
                detalle="Agendar o registrar una visita"
                tono="amber"
              />

              <AccionRapida
                href="/cobros"
                icono="💰"
                titulo="Nuevo cobro"
                detalle="Programar un cobro a cliente"
                tono="emerald"
              />

              <AccionRapida
                href="/clientes"
                icono="🔎"
                titulo="Buscar cliente"
                detalle="Abrir su información e historial"
                tono="blue"
              />
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Módulos
              </p>
              <h2 className="mt-2 text-2xl font-black">Todo Insor en un lugar</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Modulo
                href="/entregas"
                icono="📦"
                titulo="Entregas"
                descripcion="Depósito, reparto, retiros, etiquetas y QR."
                tono="cyan"
              />

              <Modulo
                href="/cobros"
                icono="💰"
                titulo="Cobros"
                descripcion="Pendientes, vencidos, realizados y reprogramados."
                tono="emerald"
              />

              <Modulo
                href="/visitas"
                icono="👤"
                titulo="Visitas"
                descripcion="Agenda comercial, resultados y seguimientos."
                tono="amber"
              />

              <Modulo
                href="/clientes"
                icono="👥"
                titulo="Clientes"
                descripcion="Datos, contactos y futuro historial 360°."
                tono="blue"
              />

              <Modulo
                href="/reportes"
                icono="📊"
                titulo="Reportes"
                descripcion="Resultados de entregas, cobros y visitas."
                tono="rose"
              />
            </div>
          </section>
        </div>
      </main>
    </LayoutOperaciones>
  );
}

function PanelOperativo({
  resumen,
  cargando,
}: {
  resumen: Record<string, any>;
  cargando: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            Operación del día
          </p>
          <h2 className="mt-2 text-2xl font-black">Estado general</h2>
        </div>

        <Link
          href="/entregas"
          className="text-sm font-bold text-cyan-300 hover:text-cyan-200"
        >
          Abrir entregas →
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DatoOperacion
          etiqueta="En depósito"
          valor={cargando ? "..." : resumen.entregasEnDeposito.length}
        />
        <DatoOperacion
          etiqueta="En reparto"
          valor={cargando ? "..." : resumen.entregasEnReparto.length}
        />
        <DatoOperacion
          etiqueta="Entregas para hoy"
          valor={cargando ? "..." : resumen.entregasHoy.length}
        />
        <DatoOperacion
          etiqueta="Entregadas hoy"
          valor={cargando ? "..." : resumen.entregadasHoy.length}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Cobros programados
            </p>
            <p className="mt-1 text-lg font-black">
              {cargando
                ? "Cargando..."
                : `${resumen.cobrosHoy.length} para hoy`}
            </p>
          </div>

          <div className="text-left sm:text-right">
            {resumen.totalCobrosUYU > 0 && (
              <p className="font-black text-emerald-200">
                {formatearDinero(resumen.totalCobrosUYU, "UYU")}
              </p>
            )}
            {resumen.totalCobrosUSD > 0 && (
              <p className="font-black text-emerald-200">
                {formatearDinero(resumen.totalCobrosUSD, "USD")}
              </p>
            )}
            {!cargando &&
              resumen.totalCobrosUYU === 0 &&
              resumen.totalCobrosUSD === 0 && (
                <p className="text-sm text-emerald-100/70">Sin importes para hoy</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelAlertas({
  resumen,
  cargando,
}: {
  resumen: Record<string, any>;
  cargando: boolean;
}) {
  const sinAlertas = !cargando && resumen.vencidos === 0;

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400">
        Atención
      </p>
      <h2 className="mt-2 text-2xl font-black">Alertas importantes</h2>

      <div className="mt-5 space-y-3">
        {cargando && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
            Revisando pendientes...
          </div>
        )}

        {!cargando && resumen.entregasVencidas.length > 0 && (
          <AlertaLinea
            href="/entregas"
            icono="📦"
            texto={`${resumen.entregasVencidas.length} entregas atrasadas`}
          />
        )}

        {!cargando && resumen.cobrosVencidos.length > 0 && (
          <AlertaLinea
            href="/cobros"
            icono="💰"
            texto={`${resumen.cobrosVencidos.length} cobros vencidos`}
          />
        )}

        {!cargando && resumen.visitasVencidas.length > 0 && (
          <AlertaLinea
            href="/visitas"
            icono="👤"
            texto={`${resumen.visitasVencidas.length} visitas atrasadas`}
          />
        )}

        {sinAlertas && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="font-black text-emerald-200">✓ Todo al día</p>
            <p className="mt-1 text-sm text-emerald-100/70">
              No hay tareas vencidas en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Indicador({
  href,
  icono,
  titulo,
  valor,
  detalle,
  tono,
}: {
  href: string;
  icono: string;
  titulo: string;
  valor: string;
  detalle: string;
  tono: Tono;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.75rem] border bg-slate-900 p-5 shadow-xl transition duration-200 hover:-translate-y-1 ${estiloBorde(
        tono
      )}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {titulo}
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight">{valor}</p>
          <p className="mt-2 text-sm text-slate-400">{detalle}</p>
        </div>

        <div className={`rounded-2xl p-3 text-2xl ${estiloFondo(tono)}`}>
          {icono}
        </div>
      </div>
    </Link>
  );
}

function AccionRapida({
  href,
  icono,
  titulo,
  detalle,
  tono,
}: {
  href: string;
  icono: string;
  titulo: string;
  detalle: string;
  tono: Tono;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.75rem] border bg-slate-900 p-5 shadow-xl transition hover:-translate-y-1 ${estiloBorde(
        tono
      )}`}
    >
      <div className={`inline-flex rounded-2xl p-3 text-2xl ${estiloFondo(tono)}`}>
        {icono}
      </div>
      <h3 className="mt-4 text-lg font-black">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detalle}</p>
    </Link>
  );
}

function Modulo({
  href,
  icono,
  titulo,
  descripcion,
  tono,
}: {
  href: string;
  icono: string;
  titulo: string;
  descripcion: string;
  tono: Tono;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.75rem] border bg-slate-900 p-5 shadow-xl transition hover:-translate-y-1 ${estiloBorde(
        tono
      )}`}
    >
      <div className="text-3xl">{icono}</div>
      <h3 className="mt-4 text-xl font-black">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{descripcion}</p>
      <p className="mt-5 text-sm font-bold text-white">Abrir →</p>
    </Link>
  );
}

function DatoOperacion({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-400">{etiqueta}</p>
      <p className="mt-2 text-2xl font-black">{valor}</p>
    </div>
  );
}

function AlertaLinea({
  href,
  icono,
  texto,
}: {
  href: string;
  icono: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 transition hover:border-rose-400/50"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icono}</span>
        <span className="font-bold text-rose-100">{texto}</span>
      </div>
      <span className="text-rose-200">→</span>
    </Link>
  );
}

function estiloBorde(tono: Tono) {
  const estilos: Record<Tono, string> = {
    cyan: "border-cyan-500/25 hover:border-cyan-400",
    emerald: "border-emerald-500/25 hover:border-emerald-400",
    amber: "border-amber-500/25 hover:border-amber-400",
    rose: "border-rose-500/25 hover:border-rose-400",
    blue: "border-blue-500/25 hover:border-blue-400",
  };

  return estilos[tono];
}

function estiloFondo(tono: Tono) {
  const estilos: Record<Tono, string> = {
    cyan: "bg-cyan-500/10 text-cyan-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
    rose: "bg-rose-500/10 text-rose-300",
    blue: "bg-blue-500/10 text-blue-300",
  };

  return estilos[tono];
}

function obtenerFecha(item: Registro, campos: string[]): string {
  for (const campo of campos) {
    const valor = item[campo];

    if (typeof valor === "string" && valor.length >= 10) {
      return valor.slice(0, 10);
    }
  }

  return "";
}

function fechaLocalISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerSaludo() {
  const hora = new Date().getHours();

  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatearFechaLarga(fecha: Date) {
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function formatearDinero(valor: number, moneda: "UYU" | "USD") {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
}