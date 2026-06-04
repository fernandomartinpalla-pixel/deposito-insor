"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Entrega = {
  id: number;
  cliente: string;
  fecha_entregado: string;
  numero_factura: string;
  monto: number;
  observaciones: string | null;
  created_at?: string;
  activo?: boolean;
  eliminado_en?: string | null;
  eliminado_motivo?: string | null;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [factura, setFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [busquedaPapelera, setBusquedaPapelera] = useState("");
  const [editando, setEditando] = useState<Entrega | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [vista, setVista] = useState<"inicio" | "historial" | "papelera">("inicio");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setCargandoSesion(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      cargarEntregas();
    }
  }, [user]);

  async function iniciarSesion() {
    setMensaje("");

    if (!email || !password) {
      setMensaje("Ingresá email y contraseña.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje("Error al iniciar sesión: " + error.message);
      return;
    }

    setEmail("");
    setPassword("");
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUser(null);
    setEntregas([]);
    setMensaje("");
  }

  async function cargarEntregas() {
    const { data, error } = await supabase
      .from("entregas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      setMensaje("Error al cargar entregas: " + error.message);
      return;
    }

    setEntregas(data || []);
  }

  function fechaUY(fechaIso: string) {
    if (!fechaIso) return "";
    const [y, m, d] = fechaIso.split("-");
    return `${d}/${m}/${y}`;
  }

  function limpiarFormulario() {
    setCliente("");
    setFecha(new Date().toISOString().slice(0, 10));
    setFactura("");
    setMonto("");
    setObservaciones("");
  }

  async function guardarEntrega() {
    setMensaje("");

    if (!cliente.trim() || !fecha || !factura.trim() || !monto) {
      setMensaje("Completá cliente, fecha, número de factura y monto.");
      return;
    }

    const facturaDuplicada = entregas.some(
      (e) =>
        e.activo !== false &&
        e.numero_factura.trim().toLowerCase() === factura.trim().toLowerCase()
    );

    if (facturaDuplicada) {
      setMensaje("Esa factura ya está cargada.");
      return;
    }

    const { error } = await supabase.from("entregas").insert([
      {
        cliente: cliente.trim(),
        fecha_entregado: fecha,
        numero_factura: factura.trim(),
        monto: Number(monto),
        observaciones: observaciones.trim(),
        activo: true,
      },
    ]);

    if (error) {
      setMensaje("Error al guardar: " + error.message);
      return;
    }

    setMensaje("Entrega guardada correctamente.");
    limpiarFormulario();
    cargarEntregas();
  }

  async function actualizarEntrega() {
    if (!editando) return;

    if (!editando.cliente.trim() || !editando.fecha_entregado || !editando.numero_factura.trim()) {
      setMensaje("Cliente, fecha y factura no pueden quedar vacíos.");
      return;
    }

    const duplicada = entregas.some(
      (e) =>
        e.id !== editando.id &&
        e.activo !== false &&
        e.numero_factura.trim().toLowerCase() === editando.numero_factura.trim().toLowerCase()
    );

    if (duplicada) {
      setMensaje("Esa factura ya existe en otra entrega.");
      return;
    }

    const { error } = await supabase
      .from("entregas")
      .update({
        cliente: editando.cliente.trim(),
        fecha_entregado: editando.fecha_entregado,
        numero_factura: editando.numero_factura.trim(),
        monto: Number(editando.monto),
        observaciones: editando.observaciones || "",
      })
      .eq("id", editando.id);

    if (error) {
      setMensaje("Error al actualizar: " + error.message);
      return;
    }

    setMensaje("Entrega actualizada correctamente.");
    setEditando(null);
    cargarEntregas();
  }

  async function mandarAPapelera(id: number) {
    const { error } = await supabase
      .from("entregas")
      .update({
        activo: false,
        eliminado_en: new Date().toISOString(),
        eliminado_motivo: "Eliminado desde sistema",
      })
      .eq("id", id);

    if (error) {
      setMensaje("Error al enviar a papelera: " + error.message);
      return;
    }

    setMensaje("Entrega enviada a papelera.");
    setConfirmarEliminar(null);
    setEditando(null);
    cargarEntregas();
  }

  async function restaurarEntrega(id: number) {
    const { error } = await supabase
      .from("entregas")
      .update({
        activo: true,
        eliminado_en: null,
        eliminado_motivo: null,
      })
      .eq("id", id);

    if (error) {
      setMensaje("Error al restaurar: " + error.message);
      return;
    }

    setMensaje("Entrega restaurada correctamente.");
    cargarEntregas();
  }

  function exportarCSV(datos: Entrega[], nombre: string) {
    const encabezados = [
      "id",
      "cliente",
      "fecha_entregado",
      "numero_factura",
      "monto",
      "observaciones",
      "activo",
      "eliminado_en",
    ];

    const filas = datos.map((e) =>
      [
        e.id,
        e.cliente,
        fechaUY(e.fecha_entregado),
        e.numero_factura,
        e.monto,
        e.observaciones || "",
        e.activo !== false ? "activo" : "papelera",
        e.eliminado_en || "",
      ]
        .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = nombre;
    link.click();

    URL.revokeObjectURL(url);
  }

  const activas = entregas.filter((e) => e.activo !== false);
  const papelera = entregas.filter((e) => e.activo === false);

  const entregasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    if (!texto) return activas;

    return activas.filter(
      (e) =>
        e.cliente?.toLowerCase().includes(texto) ||
        e.numero_factura?.toLowerCase().includes(texto)
    );
  }, [busqueda, entregas]);

  const papeleraFiltrada = useMemo(() => {
    const texto = busquedaPapelera.toLowerCase().trim();
    if (!texto) return papelera;

    return papelera.filter(
      (e) =>
        e.cliente?.toLowerCase().includes(texto) ||
        e.numero_factura?.toLowerCase().includes(texto)
    );
  }, [busquedaPapelera, entregas]);

  const hoy = new Date().toISOString().slice(0, 10);
  const mesActual = new Date().toISOString().slice(0, 7);

  const entregasHoy = activas.filter((e) => e.fecha_entregado === hoy).length;
  const entregasMes = activas.filter((e) => e.fecha_entregado?.startsWith(mesActual)).length;
  const clientesUnicos = new Set(activas.map((e) => e.cliente)).size;
  const facturasCargadas = new Set(activas.map((e) => e.numero_factura)).size;

  if (cargandoSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
          <p className="mb-2 text-sm uppercase tracking-[0.35em] text-cyan-400">
            Acceso privado
          </p>

          <h1 className="mb-2 text-4xl font-bold">📦 Depósito Insor</h1>

          <p className="mb-8 text-slate-400">
            Ingresá con tu usuario autorizado para acceder al sistema.
          </p>

          {mensaje && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100">
              {mensaje}
            </div>
          )}

          <div className="grid gap-4">
            <Input label="Email" value={email} onChange={setEmail} type="email" />

            <Input
              label="Contraseña"
              value={password}
              onChange={setPassword}
              type="password"
            />

            <button
              onClick={iniciarSesion}
              className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Iniciar sesión
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-400">
              Sistema de entregas
            </p>
            <h1 className="text-4xl font-bold md:text-5xl">📦 Depósito Insor</h1>
            <p className="text-slate-400">
              Control online de entregas, pedidos, historial y papelera.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            <p>{user.email}</p>
            <button
              onClick={cerrarSesion}
              className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-4 text-cyan-100">
            {mensaje}
          </div>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <Card titulo="Entregas de hoy" valor={entregasHoy} />
          <Card titulo="Entregas del mes" valor={entregasMes} />
          <Card titulo="Clientes únicos" valor={clientesUnicos} />
          <Card titulo="Facturas cargadas" valor={facturasCargadas} />
        </section>

        <nav className="mb-8 flex flex-wrap gap-3">
          <BotonVista activo={vista === "inicio"} onClick={() => setVista("inicio")}>
            ➕ Nueva entrega
          </BotonVista>
          <BotonVista activo={vista === "historial"} onClick={() => setVista("historial")}>
            📋 Historial
          </BotonVista>
          <BotonVista activo={vista === "papelera"} onClick={() => setVista("papelera")}>
            🗑️ Papelera ({papelera.length})
          </BotonVista>
        </nav>

        {vista === "inicio" && (
          <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <h2 className="mb-5 text-2xl font-semibold">Nueva entrega</h2>

              <div className="grid gap-4">
                <Input label="Cliente" value={cliente} onChange={setCliente} />
                <Input label="Fecha de entregado" type="date" value={fecha} onChange={setFecha} />
                <Input label="Número de factura" value={factura} onChange={setFactura} />
                <Input label="Monto" type="number" value={monto} onChange={setMonto} />

                <label className="grid gap-2 text-sm text-slate-300">
                  Observaciones
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="h-28 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </label>

                <button
                  onClick={guardarEntrega}
                  className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Guardar entrega
                </button>
              </div>
            </div>

            <PanelUltimas entregas={activas.slice(0, 6)} fechaUY={fechaUY} />
          </section>
        )}

        {vista === "historial" && (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Historial</h2>
                <p className="text-sm text-slate-400">Buscar por cliente o número de factura.</p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar..."
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                />

                <button
                  onClick={() => exportarCSV(entregasFiltradas, "historial_entregas.csv")}
                  className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            <TablaEntregas
              entregas={entregasFiltradas}
              fechaUY={fechaUY}
              onEditar={setEditando}
            />
          </section>
        )}

        {vista === "papelera" && (
          <section className="rounded-3xl border border-red-500/30 bg-slate-900/70 p-6 shadow-xl">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">🗑️ Papelera</h2>
                <p className="text-sm text-slate-400">
                  Entregas eliminadas. Podés restaurarlas o exportarlas.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={busquedaPapelera}
                  onChange={(e) => setBusquedaPapelera(e.target.value)}
                  placeholder="Buscar en papelera..."
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-red-400"
                />

                <button
                  onClick={() => exportarCSV(papeleraFiltrada, "papelera_entregas.csv")}
                  className="rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-400"
                >
                  Exportar papelera
                </button>
              </div>
            </div>

            <TablaPapelera
              entregas={papeleraFiltrada}
              fechaUY={fechaUY}
              onRestaurar={restaurarEntrega}
            />
          </section>
        )}

        {editando && (
          <section className="mt-8 rounded-3xl border border-cyan-500/30 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Editar entrega</h2>
              <button
                onClick={() => setEditando(null)}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Cliente"
                value={editando.cliente}
                onChange={(v) => setEditando({ ...editando, cliente: v })}
              />

              <Input
                label="Fecha"
                type="date"
                value={editando.fecha_entregado}
                onChange={(v) => setEditando({ ...editando, fecha_entregado: v })}
              />

              <Input
                label="Número de factura"
                value={editando.numero_factura}
                onChange={(v) => setEditando({ ...editando, numero_factura: v })}
              />

              <Input
                label="Monto"
                type="number"
                value={String(editando.monto)}
                onChange={(v) => setEditando({ ...editando, monto: Number(v) })}
              />

              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                Observaciones
                <textarea
                  value={editando.observaciones || ""}
                  onChange={(e) =>
                    setEditando({ ...editando, observaciones: e.target.value })
                  }
                  className="h-24 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button
                onClick={actualizarEntrega}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Actualizar entrega
              </button>

              <button
                onClick={() => setConfirmarEliminar(editando.id)}
                className="rounded-xl bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-400"
              >
                Enviar a papelera
              </button>
            </div>

            {confirmarEliminar === editando.id && (
              <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
                <p className="mb-4 text-red-200">
                  ¿Seguro que querés enviar a papelera la factura {editando.numero_factura} de{" "}
                  {editando.cliente}?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => mandarAPapelera(editando.id)}
                    className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white"
                  >
                    Sí, enviar
                  </button>

                  <button
                    onClick={() => setConfirmarEliminar(null)}
                    className="rounded-xl bg-slate-800 px-4 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <p className="text-sm text-slate-400">{titulo}</p>
      <p className="mt-2 text-4xl font-bold text-cyan-300">{valor}</p>
    </div>
  );
}

function BotonVista({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 font-semibold transition ${
        activo
          ? "bg-cyan-500 text-slate-950"
          : "bg-slate-900 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function TablaEntregas({
  entregas,
  fechaUY,
  onEditar,
}: {
  entregas: Entrega[];
  fechaUY: (fecha: string) => string;
  onEditar: (entrega: Entrega) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-950 text-slate-300">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Factura</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Observaciones</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-t border-slate-800">
              <td className="px-4 py-3">{fechaUY(e.fecha_entregado)}</td>
              <td className="px-4 py-3 font-medium">{e.cliente}</td>
              <td className="px-4 py-3">{e.numero_factura}</td>
              <td className="px-4 py-3">$ {Number(e.monto).toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-400">{e.observaciones}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onEditar(e)}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}

          {entregas.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                No hay entregas para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TablaPapelera({
  entregas,
  fechaUY,
  onRestaurar,
}: {
  entregas: Entrega[];
  fechaUY: (fecha: string) => string;
  onRestaurar: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-slate-950 text-slate-300">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Factura</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Eliminado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-t border-slate-800">
              <td className="px-4 py-3">{fechaUY(e.fecha_entregado)}</td>
              <td className="px-4 py-3 font-medium">{e.cliente}</td>
              <td className="px-4 py-3">{e.numero_factura}</td>
              <td className="px-4 py-3">$ {Number(e.monto).toFixed(2)}</td>
              <td className="px-4 py-3 text-slate-400">
                {e.eliminado_en ? new Date(e.eliminado_en).toLocaleString("es-UY") : "-"}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onRestaurar(e.id)}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Restaurar
                </button>
              </td>
            </tr>
          ))}

          {entregas.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                La papelera está vacía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PanelUltimas({
  entregas,
  fechaUY,
}: {
  entregas: Entrega[];
  fechaUY: (fecha: string) => string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <h2 className="mb-5 text-2xl font-semibold">Últimas entregas</h2>

      <div className="grid gap-3">
        {entregas.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{e.cliente}</p>
                <p className="text-sm text-slate-400">
                  Factura {e.numero_factura} · {fechaUY(e.fecha_entregado)}
                </p>
              </div>
              <p className="text-sm text-cyan-300">$ {Number(e.monto).toFixed(2)}</p>
            </div>
          </div>
        ))}

        {entregas.length === 0 && (
          <p className="text-slate-400">Todavía no hay entregas cargadas.</p>
        )}
      </div>
    </div>
  );
}