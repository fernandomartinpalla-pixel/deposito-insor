"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Estado = "a_entregar" | "pendiente" | "entregado" | "papelera";
type FiltroHistorial = "ultimos5" | "esteMes" | "porMes" | "todas";

type Entrega = {
  id: number;
  cliente: string;
  fecha_entregado: string;
  numero_factura: string;
  monto: number;
  observaciones: string | null;
  estado: Estado;
  created_at?: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [factura, setFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtroHistorial, setFiltroHistorial] =
    useState<FiltroHistorial>("ultimos5");

  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    obtenerSesion();
  }, []);

  async function obtenerSesion() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
    setLoading(false);

    if (session?.user) cargarEntregas();

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) cargarEntregas();
    });
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMensaje(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function cargarEntregas() {
    const { data, error } = await supabase
      .from("entregas")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) setEntregas(data as Entrega[]);
  }

  async function guardarEntrega() {
    setMensaje("");

    if (!cliente || !factura || !monto) {
      setMensaje("Faltan datos.");
      return;
    }

    const { error } = await supabase.from("entregas").insert([
      {
        cliente,
        fecha_entregado: fecha,
        numero_factura: factura,
        monto: Number(monto),
        observaciones,
        estado: "a_entregar",
      },
    ]);

    if (error) {
      setMensaje(error.message);
      return;
    }

    setCliente("");
    setFactura("");
    setMonto("");
    setObservaciones("");

    await cargarEntregas();
    setMensaje("Pedido agregado.");
  }

  async function cambiarEstado(id: number, estado: Estado) {
    await supabase.from("entregas").update({ estado }).eq("id", id);
    await cargarEntregas();
  }

  function fechaUY(fecha: string) {
    const [y, m, d] = fecha.split("-");
    return `${d}/${m}/${y}`;
  }

  function nombreMes(mes: string) {
    const [anio, nroMes] = mes.split("-");
    const nombres = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Setiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    return `${nombres[Number(nroMes) - 1]} ${anio}`;
  }

  const filtradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return entregas.filter(
      (e) =>
        e.cliente?.toLowerCase().includes(texto) ||
        e.numero_factura?.toLowerCase().includes(texto)
    );
  }, [busqueda, entregas]);

  const aEntregar = filtradas.filter((e) => e.estado === "a_entregar");
  const pendientes = filtradas.filter((e) => e.estado === "pendiente");
  const entregados = filtradas.filter((e) => e.estado === "entregado");
  const papelera = filtradas.filter((e) => e.estado === "papelera");

  const mesesDisponibles = useMemo(() => {
    const meses = entregados
      .map((e) => e.fecha_entregado.slice(0, 7))
      .filter(Boolean);

    return Array.from(new Set(meses)).sort().reverse();
  }, [entregados]);

  const entregadosFiltrados = useMemo(() => {
    const hoy = new Date();
    const hoyIso = hoy.toISOString().slice(0, 10);
    const mesActual = hoyIso.slice(0, 7);

    if (filtroHistorial === "todas") {
      return entregados;
    }

    if (filtroHistorial === "esteMes") {
      return entregados.filter((e) => e.fecha_entregado.startsWith(mesActual));
    }

    if (filtroHistorial === "porMes") {
      if (!mesSeleccionado) return [];
      return entregados.filter((e) =>
        e.fecha_entregado.startsWith(mesSeleccionado)
      );
    }

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 4);
    const limiteIso = fechaLimite.toISOString().slice(0, 10);

    return entregados.filter((e) => e.fecha_entregado >= limiteIso);
  }, [entregados, filtroHistorial, mesSeleccionado]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Cargando...
      </main>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} mensaje={mensaje} />;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <aside className="w-72 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
          <h1 className="text-4xl font-bold mb-2">📦 Depósito</h1>

          <p className="text-slate-400 mb-8">
            Sistema de reparto y entregas
          </p>

          <div className="space-y-4">
            <Card titulo="🚚 A entregar" valor={aEntregar.length} color="bg-cyan-500" />
            <Card titulo="⏳ Pendientes" valor={pendientes.length} color="bg-yellow-500" />
            <Card titulo="✅ Entregados" valor={entregados.length} color="bg-emerald-500" />
            <Card titulo="🗑️ Papelera" valor={papelera.length} color="bg-red-500" />
          </div>

          <div className="mt-10 text-sm text-slate-400">
            <p>{user.email}</p>

            <button
              onClick={logout}
              className="mt-3 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <section className="flex-1 p-8">
          <div className="flex flex-col lg:flex-row gap-5 justify-between mb-8">
            <div>
              <h2 className="text-5xl font-bold">Dashboard</h2>
              <p className="text-slate-400 mt-2">
                Gestión de pedidos y entregas
              </p>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente o factura..."
              className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 w-full lg:w-96"
            />
          </div>

          {mensaje && (
            <div className="bg-cyan-500/20 border border-cyan-500 text-cyan-100 px-5 py-4 rounded-2xl mb-6">
              {mensaje}
            </div>
          )}

          <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6 mb-10">
            <h3 className="text-2xl font-bold mb-6">➕ Nuevo pedido</h3>

            <div className="grid lg:grid-cols-2 gap-5">
              <Input placeholder="Cliente" value={cliente} onChange={setCliente} />
              <Input placeholder="Número de factura" value={factura} onChange={setFactura} />
              <Input type="date" value={fecha} onChange={setFecha} />
              <Input type="number" placeholder="Monto" value={monto} onChange={setMonto} />
            </div>

            <textarea
              placeholder="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full mt-5 bg-slate-950 border border-slate-700 rounded-2xl p-5 h-32"
            />

            <button
              onClick={guardarEntrega}
              className="mt-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-4 rounded-2xl"
            >
              Guardar pedido
            </button>
          </section>

          <GridSection
            titulo="🚚 Pedidos a entregar"
            color="border-cyan-500"
            entregas={aEntregar}
            fechaUY={fechaUY}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✅ Entregado" color="bg-emerald-500" onClick={() => cambiarEstado(e.id, "entregado")} />
                <Boton texto="⏳ Pendiente" color="bg-yellow-500" onClick={() => cambiarEstado(e.id, "pendiente")} />
                <Boton texto="🗑️ Papelera" color="bg-red-500" onClick={() => cambiarEstado(e.id, "papelera")} />
              </div>
            )}
          />

          <GridSection
            titulo="⏳ Pedidos pendientes"
            color="border-yellow-500"
            entregas={pendientes}
            fechaUY={fechaUY}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="🚚 Volver a entregar" color="bg-cyan-500" onClick={() => cambiarEstado(e.id, "a_entregar")} />
                <Boton texto="✅ Entregado" color="bg-emerald-500" onClick={() => cambiarEstado(e.id, "entregado")} />
              </div>
            )}
          />

          <section className="bg-slate-900 border border-emerald-500 rounded-3xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
              <div>
                <h2 className="text-2xl font-bold">✅ Historial entregado</h2>
                <p className="text-slate-400">
                  Mostrando {entregadosFiltrados.length} entregas
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <select
                  value={filtroHistorial}
                  onChange={(e) =>
                    setFiltroHistorial(e.target.value as FiltroHistorial)
                  }
                  className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3"
                >
                  <option value="ultimos5">Últimos 5 días</option>
                  <option value="esteMes">Este mes</option>
                  <option value="porMes">Por mes</option>
                  <option value="todas">Todas</option>
                </select>

                {filtroHistorial === "porMes" && (
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3"
                  >
                    <option value="">Seleccionar mes</option>
                    {mesesDisponibles.map((mes) => (
                      <option key={mes} value={mes}>
                        {nombreMes(mes)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <TablaEntregas
              entregas={entregadosFiltrados}
              fechaUY={fechaUY}
              acciones={(e) => (
                <Boton texto="🗑️ Papelera" color="bg-red-500" onClick={() => cambiarEstado(e.id, "papelera")} />
              )}
            />
          </section>

          <GridSection
            titulo="🗑️ Papelera"
            color="border-red-500"
            entregas={papelera}
            fechaUY={fechaUY}
            acciones={(e) => (
              <Boton texto="♻️ Restaurar" color="bg-cyan-500" onClick={() => cambiarEstado(e.id, "a_entregar")} />
            )}
          />
        </section>
      </div>
    </main>
  );
}

function LoginScreen({
  onLogin,
  mensaje,
}: {
  onLogin: (email: string, password: string) => void;
  mensaje: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 w-full max-w-lg">
        <p className="text-cyan-400 tracking-[0.4em] text-sm mb-3">
          ACCESO PRIVADO
        </p>

        <h1 className="text-5xl font-bold mb-5">📦 Depósito Insor</h1>

        <p className="text-slate-400 mb-8">Ingresá con usuario autorizado.</p>

        {mensaje && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-2xl mb-6">
            {mensaje}
          </div>
        )}

        <div className="space-y-5">
          <Input placeholder="Email" value={email} onChange={setEmail} />
          <Input type="password" placeholder="Contraseña" value={password} onChange={setPassword} />

          <button
            onClick={() => onLogin(email, password)}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-2xl"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </main>
  );
}

function Card({
  titulo,
  valor,
  color,
}: {
  titulo: string;
  valor: number;
  color: string;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
      <div className={`w-3 h-3 rounded-full ${color} mb-3`} />
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-4xl font-bold mt-2">{valor}</h3>
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 w-full"
    />
  );
}

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

function GridSection({
  titulo,
  color,
  entregas,
  fechaUY,
  acciones,
}: {
  titulo: string;
  color: string;
  entregas: Entrega[];
  fechaUY: (fecha: string) => string;
  acciones: (e: Entrega) => React.ReactNode;
}) {
  return (
    <section className={`bg-slate-900 border ${color} rounded-3xl p-6 mb-8`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <p className="text-slate-400">{entregas.length} pedidos</p>
      </div>

      <TablaEntregas entregas={entregas} fechaUY={fechaUY} acciones={acciones} />
    </section>
  );
}

function TablaEntregas({
  entregas,
  fechaUY,
  acciones,
}: {
  entregas: Entrega[];
  fechaUY: (fecha: string) => string;
  acciones: (e: Entrega) => React.ReactNode;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="text-left border-b border-slate-800 text-slate-400">
            <th className="pb-4">Cliente</th>
            <th className="pb-4">Factura</th>
            <th className="pb-4">Fecha</th>
            <th className="pb-4">Monto</th>
            <th className="pb-4">Observaciones</th>
            <th className="pb-4">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-b border-slate-800">
              <td className="py-5 font-semibold">{e.cliente}</td>
              <td>{e.numero_factura}</td>
              <td>{fechaUY(e.fecha_entregado)}</td>
              <td>$ {Number(e.monto).toFixed(2)}</td>
              <td className="text-slate-400">{e.observaciones}</td>
              <td>{acciones(e)}</td>
            </tr>
          ))}

          {entregas.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-slate-500">
                No hay pedidos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}