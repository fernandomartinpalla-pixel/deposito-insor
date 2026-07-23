"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { imprimirEtiquetasTermica as imprimirEtiquetas } from "@/lib/etiquetasTermica";
import CentroOperaciones from "@/components/CentroOperaciones";
import PanelNuevoPedido from "@/components/PanelNuevoPedido";
import TabsDeposito, { TabDeposito } from "@/components/TabsDeposito";
import LayoutOperaciones from "@/components/LayoutOperaciones";
import LoginScreen from "@/components/LoginScreen";
import BarraAcciones from "@/components/BarraAcciones";
import SeccionPedidos from "@/components/SeccionPedidos";
import ModalEditar from "@/components/ModalEditar";
import NotificacionEntrega from "@/components/NotificacionEntrega";
import { exportarRutaCircuit } from "@/lib/exportarCircuit";
import type {
  Entrega,
  EstadoEntrega,
  PrioridadEntrega,
  TipoEntrega,
} from "@/types/entrega";

import type { Cliente } from "@/types/cliente";

import {
  cargarPedidosEnReparto,
  cargarPedidosProntosDeposito,
  cargarHistorial,
  cargarPapelera as cargarPapeleraPedidos,
  guardarEntrega as guardarEntregaDB,
  actualizarEntrega,
  cambiarEstadoPedidos,
  filtrarPedidos,
  type FiltroHistorial,
} from "@/lib/entregas";

import {
  cargarClientes as cargarClientesDB,
  buscarCliente,
  guardarCliente,
} from "@/lib/clientes";

const USUARIOS_SOLO_LECTURA: string[] = [];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [tabActiva, setTabActiva] = useState<TabDeposito>("reparto");
  const [panelNuevoAbierto, setPanelNuevoAbierto] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [enReparto, setEnReparto] = useState<Entrega[]>([]);
  const [prontosDeposito, setProntosDeposito] = useState<Entrega[]>([]);
  const [historial, setHistorial] = useState<Entrega[]>([]);
  const [papelera, setPapelera] = useState<Entrega[]>([]);

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [papeleraCargada, setPapeleraCargada] = useState(false);

  const [cliente, setCliente] = useState("");
  const [fechaPedido, setFechaPedido] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [fechaEntrega, setFechaEntrega] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [factura, setFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadEntrega>("normal");
  const [tipoEntrega, setTipoEntrega] =
  useState<TipoEntrega>("domicilio");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState<Entrega | null>(null);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  const [notificacionEntrega, setNotificacionEntrega] = useState<{
    pedidoId: number;
    cliente: string;
  } | null>(null);

  const cerrarNotificacionEntrega = useCallback(() => {
    setNotificacionEntrega(null);
  }, []);

  const [filtroHistorial, setFiltroHistorial] =
    useState<FiltroHistorial>("ultimos5");
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7)
  );

  
  const soloLectura = user?.email
    ? USUARIOS_SOLO_LECTURA.includes(user.email)
    : false;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    cargarDatosIniciales();

    const channel = supabase
      .channel("deposito-sync-v3")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entregas" },
        (payload) => {
          const pedidoNuevo = payload.new as Entrega | undefined;
          const pedidoAnterior = payload.old as Partial<Entrega> | undefined;

          if (
            payload.eventType === "UPDATE" &&
            pedidoNuevo?.estado === "entregado" &&
            pedidoAnterior?.estado !== "entregado"
          ) {
            setNotificacionEntrega({
              pedidoId: pedidoNuevo.id,
              cliente: pedidoNuevo.cliente || "Cliente sin nombre",
            });
          }

          cargarPedidosActivos();
          cargarHistorialVisible();

          if (papeleraCargada) {
            cargarPapeleraVisible();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
        () => {
          cargarClientes();
        }
      )
      .subscribe();

    const respaldo = setInterval(() => {
      cargarPedidosActivos();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(respaldo);
    };
  }, [user, papeleraCargada]);

  useEffect(() => {
    if (!user) return;
    cargarHistorialVisible();
  }, [filtroHistorial, mesSeleccionado, user]);
  useEffect(() => {
  if (!user) return;

  const intervalo = setInterval(() => {
    cargarPedidosActivos();
    cargarHistorialVisible();

    if (papeleraCargada) {
      cargarPapeleraVisible();
    }
  }, 5000);

  return () => clearInterval(intervalo);
}, [user, filtroHistorial, mesSeleccionado, papeleraCargada]);
  useEffect(() => {
    setSeleccionados([]);
  }, [tabActiva]);



  async function login(email: string, password: string) {
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMensaje(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setEnReparto([]);
    setProntosDeposito([]);
    setHistorial([]);
    setPapelera([]);
    setSeleccionados([]);
  }

  async function cargarDatosIniciales() {
    try {
      setCargandoDatos(true);

      await Promise.all([
        cargarPedidosActivos(),
        cargarHistorialVisible(),
        cargarClientes(),
      ]);
    } catch (error: any) {
      setMensaje(error.message || "Error cargando datos.");
    } finally {
      setCargandoDatos(false);
    }
  }

  async function cargarPedidosActivos() {
    const [reparto, prontos] = await Promise.all([
      cargarPedidosEnReparto(),
      cargarPedidosProntosDeposito(),
    ]);

    setEnReparto(reparto);
    setProntosDeposito(prontos);
  }

  async function cargarHistorialVisible() {
    try {
      const data = await cargarHistorial({
        filtro: filtroHistorial,
        mesSeleccionado,
      });

      setHistorial(data);
    } catch (error: any) {
      setMensaje(error.message || "Error cargando historial.");
    }
  }

  async function cargarPapeleraVisible() {
    try {
      const data = await cargarPapeleraPedidos();

      setPapelera(data);
      setPapeleraCargada(true);
    } catch (error: any) {
      setMensaje(error.message || "Error cargando papelera.");
    }
  }

  async function cargarClientes() {
    try {
      const data = await cargarClientesDB();

      setClientes(data);
    } catch (error: any) {
      setMensaje(error.message || "Error cargando clientes.");
    }
  }

  async function autocompletarCliente(nombre: string) {
    setCliente(nombre);

    const texto = nombre.trim();

    if (texto.length < 2) {
      setTelefono("");
      setDireccion("");
      setDepartamento("");
      return;
    }

    const local = clientes.find((c) =>
      c.nombre.trim().toLowerCase().includes(texto.toLowerCase())
    );

    if (local) {
      setTelefono(local.telefono || "");
      setDireccion(local.direccion || "");
      setDepartamento(local.departamento || "");
      return;
    }

    try {
      const encontrado = await buscarCliente(texto);

      if (encontrado) {
        setTelefono(encontrado.telefono || "");
        setDireccion(encontrado.direccion || "");
        setDepartamento(encontrado.departamento || "");
      }
    } catch (error: any) {
      setMensaje(error.message || "Error buscando cliente.");
    }
  }

  async function guardarClienteAutomatico(
    nombre: string,
    tel: string,
    dir: string,
    dep: string
  ) {
    if (!nombre.trim()) return;

    await guardarCliente({
      nombre: nombre.trim(),
      telefono: tel.trim(),
      direccion: dir.trim(),
      departamento: dep.trim(),
    });

    await cargarClientes();
  }

  async function guardarPedido() {
    setMensaje("");

    if (!cliente.trim() || !factura.trim() || !monto) {
      setMensaje("Faltan datos obligatorios.");
      return;
    }

    try {
      await guardarClienteAutomatico(cliente, telefono, direccion, departamento);

await guardarEntregaDB({
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
  tipoEntrega,
});

      limpiarFormulario();
      await cargarPedidosActivos();

      setPanelNuevoAbierto(false);
      setTabActiva("deposito");
      setMensaje("Pedido agregado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "Error guardando pedido.");
    }
  }

  function limpiarFormulario() {
    setCliente("");
    setFechaPedido(new Date().toISOString().slice(0, 10));
    setFechaEntrega(new Date().toISOString().slice(0, 10));
    setFactura("");
    setMonto("");
    setObservaciones("");
    setPrioridad("normal");
    setTelefono("");
    setDireccion("");
    setDepartamento("");
  }

  function toggleSeleccion(id: number) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function alternarSeleccionTodosReparto() {
  const idsReparto = enReparto.map((pedido) => pedido.id);

  const estanTodosSeleccionados =
    idsReparto.length > 0 &&
    idsReparto.every((id) => seleccionados.includes(id));

  if (estanTodosSeleccionados) {
    setSeleccionados((actuales) =>
      actuales.filter((id) => !idsReparto.includes(id))
    );
  } else {
    setSeleccionados((actuales) => [
      ...new Set([...actuales, ...idsReparto]),
    ]);
  }
}
  async function cambiarEstadoSeleccionados(estado: EstadoEntrega) {
    setMensaje("");

    if (seleccionados.length === 0) {
      setMensaje("Seleccioná al menos un pedido.");
      return;
    }

    try {
      await cambiarEstadoPedidos(seleccionados, estado);

      const cantidad = seleccionados.length;

      setSeleccionados([]);

      await Promise.all([
        cargarPedidosActivos(),
        cargarHistorialVisible(),
        papeleraCargada ? cargarPapeleraVisible() : Promise.resolve(),
      ]);

      if (estado === "a_entregar") setTabActiva("reparto");
      if (estado === "pendiente") setTabActiva("deposito");
      if (estado === "entregado") setTabActiva("historial");
      if (estado === "papelera") setTabActiva("papelera");

      setMensaje(`Se actualizaron ${cantidad} pedidos.`);
    } catch (error: any) {
      setMensaje(error.message || "Error actualizando pedidos.");
    }
  }

  async function cambiarEstadoPedido(id: number, estado: EstadoEntrega) {
    setMensaje("");

    try {
      await cambiarEstadoPedidos([id], estado);

      await Promise.all([
        cargarPedidosActivos(),
        cargarHistorialVisible(),
        papeleraCargada ? cargarPapeleraVisible() : Promise.resolve(),
      ]);

      if (estado === "a_entregar") setTabActiva("reparto");
      if (estado === "pendiente") setTabActiva("deposito");
      if (estado === "entregado") setTabActiva("historial");
      if (estado === "papelera") setTabActiva("papelera");

      setMensaje("Pedido actualizado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "Error actualizando pedido.");
    }
  }

  async function actualizarPedido(pedidoActualizado: Entrega) {
    try {
      await guardarClienteAutomatico(
        pedidoActualizado.cliente,
        pedidoActualizado.telefono_cliente || "",
        pedidoActualizado.direccion || "",
        pedidoActualizado.departamento || ""
      );

      await actualizarEntrega(pedidoActualizado);

      setEditando(null);
      setSeleccionados([]);

      await Promise.all([
        cargarPedidosActivos(),
        cargarHistorialVisible(),
        papeleraCargada ? cargarPapeleraVisible() : Promise.resolve(),
      ]);

      setMensaje("Pedido actualizado correctamente.");
    } catch (error: any) {
      setMensaje(error.message || "Error actualizando pedido.");
    }
  }

  function editarSeleccionado() {
    if (seleccionados.length !== 1) {
      setMensaje("Para editar, seleccioná un solo pedido.");
      return;
    }

    const pedido = todosLosPedidos.find((e) => e.id === seleccionados[0]);

    if (pedido) {
      setEditando(pedido);
    }
  }

  function imprimirSeleccionados() {
    if (seleccionados.length === 0) {
      setMensaje("Seleccioná al menos un pedido para imprimir etiqueta.");
      return;
    }

    const pedidos = todosLosPedidos.filter((e) =>
      seleccionados.includes(e.id)
    );

    imprimirEtiquetas(pedidos);
  }

  const todosLosPedidos = useMemo(() => {
    return [...enReparto, ...prontosDeposito, ...historial, ...papelera];
  }, [enReparto, prontosDeposito, historial, papelera]);

  const pedidosSeleccionados = useMemo(() => {
    return todosLosPedidos.filter((e) => seleccionados.includes(e.id));
  }, [todosLosPedidos, seleccionados]);
  const todosRepartoSeleccionados = useMemo(() => {
  return (
    enReparto.length > 0 &&
    enReparto.every((pedido) => seleccionados.includes(pedido.id))
  );
}, [enReparto, seleccionados]);
  const datosFiltrados = useMemo(() => {
    return {
      enReparto: filtrarPedidos(enReparto, busqueda),
      prontosDeposito: filtrarPedidos(prontosDeposito, busqueda),
      historial: filtrarPedidos(historial, busqueda),
      papelera: filtrarPedidos(papelera, busqueda),
    };
  }, [busqueda, enReparto, prontosDeposito, historial, papelera]);

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
    <LayoutOperaciones titulo="Entregas">
      <main className="min-h-screen bg-slate-950 text-white">
        <NotificacionEntrega
        visible={notificacionEntrega !== null}
        pedidoId={notificacionEntrega?.pedidoId}
        cliente={notificacionEntrega?.cliente}
        onCerrar={cerrarNotificacionEntrega}
      />

        <section className="p-3 sm:p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-5 justify-between mb-8">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold">Depósito Insor</h2>
              <p className="text-slate-400 mt-2">
                Centro de operaciones, pedidos y entregas
                {cargandoDatos ? " · cargando datos..." : ""}
              </p>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, factura, teléfono o dirección..."
              className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 w-full lg:w-96"
            />
          </div>

          <CentroOperaciones
            enReparto={enReparto}
            prontosDeposito={prontosDeposito}
            historial={historial}
          />

          <TabsDeposito
            activa={tabActiva}
            onCambiar={setTabActiva}
            reparto={datosFiltrados.enReparto.length}
            deposito={datosFiltrados.prontosDeposito.length}
            historial={datosFiltrados.historial.length}
            papelera={datosFiltrados.papelera.length}
          />

          {mensaje && (
            <div className="bg-cyan-500/20 border border-cyan-500 text-cyan-100 px-5 py-4 rounded-2xl mb-6">
              {mensaje}
            </div>
          )}

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
  {!soloLectura && (
    <button
      onClick={() => setPanelNuevoAbierto(true)}
      className="rounded-2xl bg-cyan-500 px-6 py-4 font-black text-slate-950 hover:bg-cyan-400"
    >
      ➕ Nuevo pedido
    </button>
  )}

<button
  onClick={() => {
    const seleccionadosEnReparto = enReparto.filter((pedido) =>
      seleccionados.includes(pedido.id)
    );

    exportarRutaCircuit(seleccionadosEnReparto);
  }}
  disabled={
    enReparto.filter((pedido) => seleccionados.includes(pedido.id)).length === 0
  }
  className="rounded-2xl bg-violet-500 px-6 py-4 font-black text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
>
  🗺️ Exportar seleccionados a Circuit (
  {enReparto.filter((pedido) => seleccionados.includes(pedido.id)).length})
</button>
</div>

            {pedidosSeleccionados.length > 0 && !soloLectura && (
              <BarraAcciones
                cantidadSeleccionada={pedidosSeleccionados.length}
                onEditar={editarSeleccionado}
                onEtiquetas={imprimirSeleccionados}
                onCambiarEstado={cambiarEstadoSeleccionados}
              />
            )}
          </div>

{tabActiva === "reparto" && (
  <div>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={alternarSeleccionTodosReparto}
        disabled={enReparto.length === 0}
        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
          todosRepartoSeleccionados
            ? "bg-slate-700 text-white hover:bg-slate-600"
            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {todosRepartoSeleccionados
          ? `☐ Quitar selección (${enReparto.length})`
          : `☑ Seleccionar todos (${enReparto.length})`}
      </button>

      {seleccionados.length > 0 && (
        <span className="text-sm text-slate-400">
          {seleccionados.length} seleccionados
        </span>
      )}
    </div>

    <SeccionPedidos
      titulo="🚚 Pedidos en reparto"
      descripcion={`${datosFiltrados.enReparto.length} pedidos`}
      entregas={datosFiltrados.enReparto}
      seleccionados={seleccionados}
      onSeleccionar={toggleSeleccion}
      onEditar={setEditando}
      onImprimirEtiqueta={(pedido) => imprimirEtiquetas([pedido])}
    />
  </div>
)}

{tabActiva === "deposito" && (
  <SeccionPedidos
    titulo="📦 Pedidos prontos en depósito"
    descripcion={`${datosFiltrados.prontosDeposito.length} pedidos`}
    entregas={datosFiltrados.prontosDeposito}
    seleccionados={seleccionados}
    mostrarFiltroTipo
    onSeleccionar={toggleSeleccion}
    onEditar={setEditando}
    onImprimirEtiqueta={(pedido) => imprimirEtiquetas([pedido])}
  />
)}

          {tabActiva === "historial" && (
            <section className="bg-slate-900 border border-emerald-500 rounded-3xl p-4 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">✅ Historial entregado</h2>
                  <p className="text-slate-400">
                    Mostrando {datosFiltrados.historial.length} entregas
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
                    <option value="todas">Todas (máx. 500)</option>
                  </select>

                  {filtroHistorial === "porMes" && (
                    <input
                      type="month"
                      value={mesSeleccionado}
                      onChange={(e) => setMesSeleccionado(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3"
                    />
                  )}
                </div>
              </div>

              <SeccionPedidos
                titulo="Historial"
                descripcion={`${datosFiltrados.historial.length} pedidos`}
                entregas={datosFiltrados.historial}
                seleccionados={seleccionados}
                onSeleccionar={toggleSeleccion}
                onEditar={setEditando}
                onImprimirEtiqueta={(pedido) => imprimirEtiquetas([pedido])}
              />
            </section>
          )}

          {tabActiva === "papelera" && (
            <section className="bg-slate-900 border border-red-500 rounded-3xl p-4 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">🗑️ Papelera</h2>
                  <p className="text-slate-400">
                    {papeleraCargada
                      ? `${datosFiltrados.papelera.length} pedidos`
                      : "No se carga al abrir para mejorar rendimiento"}
                  </p>
                </div>

                {!papeleraCargada && (
                  <button
                    onClick={cargarPapeleraVisible}
                    className="bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-3 rounded-2xl"
                  >
                    Cargar papelera
                  </button>
                )}
              </div>

              {papeleraCargada && (
                <SeccionPedidos
                  titulo="Papelera"
                  descripcion={`${datosFiltrados.papelera.length} pedidos`}
                  entregas={datosFiltrados.papelera}
                  seleccionados={seleccionados}
                  onSeleccionar={toggleSeleccion}
                  onEditar={setEditando}
                  onImprimirEtiqueta={(pedido) => imprimirEtiquetas([pedido])}
                />
              )}
            </section>
          )}
        </section>

        <PanelNuevoPedido
        abierto={panelNuevoAbierto}
        onCerrar={() => setPanelNuevoAbierto(false)}
        prioridad={prioridad}
        tipoEntrega={tipoEntrega}
        clientes={clientes}
        cliente={cliente}
        fechaPedido={fechaPedido}
        fechaEntrega={fechaEntrega}
        factura={factura}
        monto={monto}
        observaciones={observaciones}
        telefono={telefono}
        direccion={direccion}
        departamento={departamento}
        onClienteChange={autocompletarCliente}
        setPrioridad={setPrioridad}
        setTipoEntrega={setTipoEntrega}
        setFechaPedido={setFechaPedido}
        setFechaEntrega={setFechaEntrega}
        setFactura={setFactura}
        setMonto={setMonto}
        setObservaciones={setObservaciones}
        setTelefono={setTelefono}
        setDireccion={setDireccion}
        setDepartamento={setDepartamento}
        onGuardar={guardarPedido}
      />

        <ModalEditar
          abierto={!!editando}
          entrega={editando}
          onCerrar={() => setEditando(null)}
          onGuardar={actualizarPedido}
        />
      </main>
    </LayoutOperaciones>
  );
}
