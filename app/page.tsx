"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Estado = "a_entregar" | "pendiente" | "entregado" | "papelera";
type Prioridad = "normal" | "urgente" | "critico";
type FiltroHistorial = "ultimos5" | "esteMes" | "porMes" | "todas";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
};

type Entrega = {
  id: number;
  cliente: string;
  fecha_entregado: string;
  fecha_pedido?: string | null;
  fecha_entrega_programada?: string | null;
  fecha_entregado_real?: string | null;
  numero_factura: string;
  monto: number;
  observaciones: string | null;
  estado: Estado;
  prioridad?: Prioridad | null;
  chofer?: string | null;
  vehiculo?: string | null;
  ruta?: string | null;
  telefono_cliente?: string | null;
  direccion?: string | null;
  created_at?: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [cliente, setCliente] = useState("");
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().slice(0, 10));
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 10));
  const [factura, setFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("normal");
  const [chofer, setChofer] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [ruta, setRuta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState<Entrega | null>(null);

  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>("ultimos5");
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    obtenerSesion();
  }, []);

  async function obtenerSesion() {
    const { data: { session } } = await supabase.auth.getSession();

    setUser(session?.user ?? null);
    setLoading(false);

    if (session?.user) {
      cargarEntregas();
      cargarClientes();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        cargarEntregas();
        cargarClientes();
      }
    });
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

    if (error) {
      setMensaje(error.message);
      return;
    }

    setEntregas(data as Entrega[]);
  }

  async function cargarClientes() {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (!error && data) {
      setClientes(data as Cliente[]);
    }
  }

  function autocompletarCliente(nombre: string) {
    setCliente(nombre);

    const encontrado = clientes.find(
      (c) => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
    );

    if (encontrado) {
      setTelefono(encontrado.telefono || "");
      setDireccion(encontrado.direccion || "");
    }
  }

  async function guardarClienteAutomatico(nombre: string, tel: string, dir: string) {
    if (!nombre.trim()) return;

    await supabase.from("clientes").upsert(
      [
        {
          nombre: nombre.trim(),
          telefono: tel.trim() || null,
          direccion: dir.trim() || null,
        },
      ],
      {
        onConflict: "nombre",
      }
    );

    await cargarClientes();
  }

  async function guardarEntrega() {
    setMensaje("");

    if (!cliente || !factura || !monto) {
      setMensaje("Faltan datos obligatorios.");
      return;
    }

    await guardarClienteAutomatico(cliente, telefono, direccion);

    const { error } = await supabase.from("entregas").insert([
      {
        cliente,
        fecha_pedido: fechaPedido,
        fecha_entrega_programada: fechaEntrega,
        fecha_entregado: fechaEntrega,
        numero_factura: factura,
        monto: Number(monto),
        observaciones,
        prioridad,
        chofer,
        vehiculo,
        ruta,
        telefono_cliente: telefono,
        direccion,
        estado: "a_entregar",
      },
    ]);

    if (error) {
      setMensaje(error.message);
      return;
    }

    limpiarFormulario();
    await cargarEntregas();
    setMensaje("Pedido agregado correctamente.");
  }

  function limpiarFormulario() {
    setCliente("");
    setFechaPedido(new Date().toISOString().slice(0, 10));
    setFechaEntrega(new Date().toISOString().slice(0, 10));
    setFactura("");
    setMonto("");
    setObservaciones("");
    setPrioridad("normal");
    setChofer("");
    setVehiculo("");
    setRuta("");
    setTelefono("");
    setDireccion("");
  }

  async function cambiarEstado(id: number, estado: Estado) {
    const updateData: Partial<Entrega> = { estado };

    if (estado === "entregado") {
      updateData.fecha_entregado_real = new Date().toISOString();
    }

    const { error } = await supabase.from("entregas").update(updateData).eq("id", id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    await cargarEntregas();
  }

  async function actualizarPedido() {
    if (!editando) return;

    await guardarClienteAutomatico(
      editando.cliente,
      editando.telefono_cliente || "",
      editando.direccion || ""
    );

    const { error } = await supabase
      .from("entregas")
      .update({
        cliente: editando.cliente,
        fecha_pedido: editando.fecha_pedido,
        fecha_entrega_programada: editando.fecha_entrega_programada,
        fecha_entregado: editando.fecha_entrega_programada || editando.fecha_entregado,
        numero_factura: editando.numero_factura,
        monto: Number(editando.monto),
        observaciones: editando.observaciones,
        prioridad: editando.prioridad || "normal",
        chofer: editando.chofer,
        vehiculo: editando.vehiculo,
        ruta: editando.ruta,
        telefono_cliente: editando.telefono_cliente,
        direccion: editando.direccion,
      })
      .eq("id", editando.id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    setEditando(null);
    await cargarEntregas();
    setMensaje("Pedido actualizado correctamente.");
  }

  function fechaUY(fecha?: string | null) {
    if (!fecha) return "-";
    const limpia = fecha.slice(0, 10);
    const [y, m, d] = limpia.split("-");
    return `${d}/${m}/${y}`;
  }

  function usd(valor: number) {
    return `USD ${Number(valor || 0).toFixed(2)}`;
  }

  function nombreMes(mes: string) {
    const [anio, nroMes] = mes.split("-");
    const nombres = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    return `${nombres[Number(nroMes) - 1]} ${anio}`;
  }

  const filtradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return entregas.filter(
      (e) =>
        e.cliente?.toLowerCase().includes(texto) ||
        e.numero_factura?.toLowerCase().includes(texto) ||
        e.chofer?.toLowerCase().includes(texto) ||
        e.ruta?.toLowerCase().includes(texto)
    );
  }, [busqueda, entregas]);

  const aEntregar = filtradas.filter((e) => e.estado === "a_entregar");
  const pendientes = filtradas.filter((e) => e.estado === "pendiente");
  const entregados = filtradas.filter((e) => e.estado === "entregado");
  const papelera = filtradas.filter((e) => e.estado === "papelera");

  const mesesDisponibles = useMemo(() => {
    const meses = entregados.map((e) => e.fecha_entregado.slice(0, 7)).filter(Boolean);
    return Array.from(new Set(meses)).sort().reverse();
  }, [entregados]);

  const entregadosFiltrados = useMemo(() => {
    const hoy = new Date();
    const hoyIso = hoy.toISOString().slice(0, 10);
    const mesActual = hoyIso.slice(0, 7);

    if (filtroHistorial === "todas") return entregados;

    if (filtroHistorial === "esteMes") {
      return entregados.filter((e) => e.fecha_entregado.startsWith(mesActual));
    }

    if (filtroHistorial === "porMes") {
      if (!mesSeleccionado) return [];
      return entregados.filter((e) => e.fecha_entregado.startsWith(mesSeleccionado));
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
      <datalist id="clientes-list">
        {clientes.map((c) => (
          <option key={c.id} value={c.nombre} />
        ))}
      </datalist>

      <div className="flex">
        <aside className="w-72 min-h-screen bg-slate-900 border-r border-slate-800 p-6">
          <h1 className="text-4xl font-bold mb-2">📦 Depósito</h1>
          <p className="text-slate-400 mb-8">Sistema de reparto y entregas</p>

          <div className="space-y-4">
            <Card titulo="🚚 A entregar" valor={aEntregar.length} color="bg-cyan-500" />
            <Card titulo="⏳ Pendientes" valor={pendientes.length} color="bg-yellow-500" />
            <Card titulo="✅ Entregados" valor={entregados.length} color="bg-emerald-500" />
            <Card titulo="🗑️ Papelera" valor={papelera.length} color="bg-red-500" />
            <Card titulo="👥 Clientes" valor={clientes.length} color="bg-purple-500" />
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
                Gestión de pedidos, reparto y clientes
              </p>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, factura, chofer o ruta..."
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

            <div className="grid lg:grid-cols-3 gap-5">
              <Input
                placeholder="Cliente"
                value={cliente}
                onChange={autocompletarCliente}
                list="clientes-list"
              />

              <Input placeholder="Número de factura" value={factura} onChange={setFactura} />
              <Input type="number" placeholder="Monto USD" value={monto} onChange={setMonto} />

              <Input type="date" placeholder="Fecha pedido" value={fechaPedido} onChange={setFechaPedido} />
              <Input type="date" placeholder="Fecha entrega" value={fechaEntrega} onChange={setFechaEntrega} />
              <SelectPrioridad value={prioridad} onChange={setPrioridad} />

              <Input placeholder="Chofer" value={chofer} onChange={setChofer} />
              <Input placeholder="Vehículo" value={vehiculo} onChange={setVehiculo} />
              <Input placeholder="Ruta" value={ruta} onChange={setRuta} />

              <Input placeholder="Teléfono cliente" value={telefono} onChange={setTelefono} />
              <Input placeholder="Dirección" value={direccion} onChange={setDireccion} />
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
            usd={usd}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
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
            usd={usd}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
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
                  onChange={(e) => setFiltroHistorial(e.target.value as FiltroHistorial)}
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
              usd={usd}
              acciones={(e) => (
                <div className="flex gap-2 flex-wrap">
                  <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
                  <Boton texto="🗑️ Papelera" color="bg-red-500" onClick={() => cambiarEstado(e.id, "papelera")} />
                </div>
              )}
            />
          </section>

          <GridSection
            titulo="🗑️ Papelera"
            color="border-red-500"
            entregas={papelera}
            fechaUY={fechaUY}
            usd={usd}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
                <Boton texto="♻️ Restaurar" color="bg-cyan-500" onClick={() => cambiarEstado(e.id, "a_entregar")} />
              </div>
            )}
          />
        </section>
      </div>

      {editando && (
        <EditarModal
          pedido={editando}
          clientes={clientes}
          setPedido={setEditando}
          onCerrar={() => setEditando(null)}
          onGuardar={actualizarPedido}
        />
      )}
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 w-full max-w-lg text-white">
        <p className="text-cyan-400 tracking-[0.4em] text-sm mb-3">ACCESO PRIVADO</p>
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

function EditarModal({
  pedido,
  clientes,
  setPedido,
  onCerrar,
  onGuardar,
}: {
  pedido: Entrega;
  clientes: Cliente[];
  setPedido: (pedido: Entrega) => void;
  onCerrar: () => void;
  onGuardar: () => void;
}) {
  function autocompletar(nombre: string) {
    const encontrado = clientes.find(
      (c) => c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()
    );

    setPedido({
      ...pedido,
      cliente: nombre,
      telefono_cliente: encontrado?.telefono || pedido.telefono_cliente || "",
      direccion: encontrado?.direccion || pedido.direccion || "",
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <datalist id="clientes-edit-list">
        {clientes.map((c) => (
          <option key={c.id} value={c.nombre} />
        ))}
      </datalist>

      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-5xl text-white max-h-[90vh] overflow-auto">
        <div className="flex justify-between gap-5 mb-6">
          <div>
            <h2 className="text-3xl font-bold">✏️ Editar pedido</h2>
            <p className="text-slate-400">Factura {pedido.numero_factura}</p>
          </div>

          <button onClick={onCerrar} className="bg-slate-800 px-4 py-2 rounded-xl">
            Cerrar
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <Input value={pedido.cliente} onChange={autocompletar} placeholder="Cliente" list="clientes-edit-list" />
          <Input value={pedido.numero_factura} onChange={(v) => setPedido({ ...pedido, numero_factura: v })} placeholder="Factura" />
          <Input type="number" value={String(pedido.monto)} onChange={(v) => setPedido({ ...pedido, monto: Number(v) })} placeholder="Monto USD" />

          <Input type="date" value={pedido.fecha_pedido || ""} onChange={(v) => setPedido({ ...pedido, fecha_pedido: v })} placeholder="Fecha pedido" />
          <Input type="date" value={pedido.fecha_entrega_programada || pedido.fecha_entregado || ""} onChange={(v) => setPedido({ ...pedido, fecha_entrega_programada: v })} placeholder="Fecha entrega" />

          <SelectPrioridad
            value={(pedido.prioridad as Prioridad) || "normal"}
            onChange={(v) => setPedido({ ...pedido, prioridad: v })}
          />

          <Input value={pedido.chofer || ""} onChange={(v) => setPedido({ ...pedido, chofer: v })} placeholder="Chofer" />
          <Input value={pedido.vehiculo || ""} onChange={(v) => setPedido({ ...pedido, vehiculo: v })} placeholder="Vehículo" />
          <Input value={pedido.ruta || ""} onChange={(v) => setPedido({ ...pedido, ruta: v })} placeholder="Ruta" />

          <Input value={pedido.telefono_cliente || ""} onChange={(v) => setPedido({ ...pedido, telefono_cliente: v })} placeholder="Teléfono cliente" />
          <Input value={pedido.direccion || ""} onChange={(v) => setPedido({ ...pedido, direccion: v })} placeholder="Dirección" />
        </div>

        <textarea
          value={pedido.observaciones || ""}
          onChange={(e) => setPedido({ ...pedido, observaciones: e.target.value })}
          placeholder="Observaciones"
          className="w-full mt-5 bg-slate-950 border border-slate-700 rounded-2xl p-5 h-32"
        />

        <button
          onClick={onGuardar}
          className="mt-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-4 rounded-2xl"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Card({ titulo, valor, color }: { titulo: string; valor: number; color: string }) {
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

function SelectPrioridad({
  value,
  onChange,
}: {
  value: Prioridad;
  onChange: (v: Prioridad) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Prioridad)}
      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 w-full"
    >
      <option value="normal">Prioridad normal</option>
      <option value="urgente">Urgente</option>
      <option value="critico">Crítico</option>
    </select>
  );
}

function Boton({ texto, color, onClick }: { texto: string; color: string; onClick: () => void }) {
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
  usd,
  acciones,
}: {
  titulo: string;
  color: string;
  entregas: Entrega[];
  fechaUY: (fecha?: string | null) => string;
  usd: (valor: number) => string;
  acciones: (e: Entrega) => React.ReactNode;
}) {
  return (
    <section className={`bg-slate-900 border ${color} rounded-3xl p-6 mb-8`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <p className="text-slate-400">{entregas.length} pedidos</p>
      </div>

      <TablaEntregas entregas={entregas} fechaUY={fechaUY} usd={usd} acciones={acciones} />
    </section>
  );
}

function TablaEntregas({
  entregas,
  fechaUY,
  usd,
  acciones,
}: {
  entregas: Entrega[];
  fechaUY: (fecha?: string | null) => string;
  usd: (valor: number) => string;
  acciones: (e: Entrega) => React.ReactNode;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1100px]">
        <thead>
          <tr className="text-left border-b border-slate-800 text-slate-400">
            <th className="pb-4">Cliente</th>
            <th className="pb-4">Factura</th>
            <th className="pb-4">Entrega</th>
            <th className="pb-4">Prioridad</th>
            <th className="pb-4">Chofer/Ruta</th>
            <th className="pb-4">Monto</th>
            <th className="pb-4">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-b border-slate-800">
<td className="py-5 font-semibold">
  <div>{e.cliente}</div>

  <div className="text-xs text-slate-500">
    {e.telefono_cliente || ""}
  </div>

  <div className="text-xs text-slate-500">
    {e.direccion || ""}
  </div>

  {e.observaciones && (
    <div className="mt-2 text-xs text-cyan-300 bg-slate-800 rounded-lg px-3 py-2 max-w-xs">
      📝 {e.observaciones}
    </div>
  )}
</td>

              <td>{e.numero_factura}</td>
              <td>{fechaUY(e.fecha_entrega_programada || e.fecha_entregado)}</td>

              <td>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  e.prioridad === "critico"
                    ? "bg-red-500 text-white"
                    : e.prioridad === "urgente"
                    ? "bg-yellow-500 text-black"
                    : "bg-slate-700 text-slate-200"
                }`}>
                  {e.prioridad || "normal"}
                </span>
              </td>

              <td>
                <div>{e.chofer || "-"}</div>
                <div className="text-xs text-slate-500">{e.ruta || ""}</div>
              </td>

              <td>{usd(e.monto)}</td>
              <td>{acciones(e)}</td>
            </tr>
          ))}

          {entregas.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-500">
                No hay pedidos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}