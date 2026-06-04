"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
  departamento?: string | null;
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
  telefono_cliente?: string | null;
  direccion?: string | null;
  departamento?: string | null;
  created_at?: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);

  const [cliente, setCliente] = useState("");
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().slice(0, 10));
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().slice(0, 10));
  const [factura, setFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("normal");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState<Entrega | null>(null);
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);

  const [filtroHistorial, setFiltroHistorial] = useState<FiltroHistorial>("ultimos5");
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    cargarEntregas();
    cargarClientes();

    const channel = supabase
      .channel("deposito-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "entregas" }, () => {
        cargarEntregas();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, () => {
        cargarClientes();
      })
      .subscribe();

    const intervalo = setInterval(() => {
      cargarEntregas();
      cargarClientes();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalo);
    };
  }, [user]);

  async function login(email: string, password: string) {
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje(error.message);
    }
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

    const normalizadas = (data || []).map((e) => ({
      ...e,
      estado: e.estado || "a_entregar",
      prioridad: e.prioridad || "normal",
    })) as Entrega[];

    setEntregas(normalizadas);
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
      setDepartamento(encontrado.departamento || "");
    }
  }

  async function guardarClienteAutomatico(nombre: string, tel: string, dir: string, dep: string) {
    if (!nombre.trim()) return;

    await supabase.from("clientes").upsert(
      [
        {
          nombre: nombre.trim(),
          telefono: tel.trim() || null,
          direccion: dir.trim() || null,
          departamento: dep.trim() || null,
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

    if (!cliente.trim() || !factura.trim() || !monto) {
      setMensaje("Faltan datos obligatorios.");
      return;
    }

    await guardarClienteAutomatico(cliente, telefono, direccion, departamento);

    const { error } = await supabase.from("entregas").insert([
      {
        cliente: cliente.trim(),
        fecha_pedido: fechaPedido,
        fecha_entrega_programada: fechaEntrega,
        fecha_entregado: fechaEntrega,
        numero_factura: factura.trim(),
        monto: Number(monto),
        observaciones: observaciones.trim(),
        prioridad,
        telefono_cliente: telefono.trim(),
        direccion: direccion.trim(),
        departamento: departamento.trim(),
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
    setTelefono("");
    setDireccion("");
    setDepartamento("");
  }

  async function cambiarEstado(id: number, estado: Estado) {
    const updateData: Partial<Entrega> = { estado };

    if (estado === "entregado") {
      updateData.fecha_entregado_real = new Date().toISOString();
    }

    const { error } = await supabase
      .from("entregas")
      .update(updateData)
      .eq("id", id);

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
      editando.direccion || "",
      editando.departamento || ""
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
        telefono_cliente: editando.telefono_cliente,
        direccion: editando.direccion,
        departamento: editando.departamento,
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

 function imprimirEtiqueta(pedido: Entrega) {
  const ventana = window.open("", "_blank");

  if (!ventana) {
    setMensaje("El navegador bloqueó la ventana de impresión.");
    return;
  }

  const fecha = new Date().toLocaleDateString("es-UY");

  ventana.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Etiqueta ${pedido.numero_factura}</title>

        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            font-family: Arial, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
            color: #111;
          }

          .sheet {
            width: 100%;
            padding: 10px;
            box-sizing: border-box;
          }

          .etiqueta {
            border: 3px solid #111;
            padding: 16px;
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            gap: 12px;
            margin-bottom: 14px;
          }

          .logo {
            width: 180px;
            border: 2px solid #111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
            font-weight: 900;
          }

          .empresa {
            flex: 1;
            border: 2px solid #111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 900;
            text-align: center;
            padding: 10px;
          }

          .fecha {
            width: 170px;
            border: 2px solid #111;
            padding: 10px;
            box-sizing: border-box;
          }

          .fecha-title {
            font-size: 15px;
            font-weight: 900;
            margin-bottom: 8px;
          }

          .fecha-value {
            font-size: 26px;
            font-weight: 700;
          }

          .middle {
            display: flex;
            gap: 18px;
            margin-bottom: 18px;
          }

          .box {
            flex: 1;
            border: 2px solid #111;
            padding: 14px;
            min-height: 290px;
            box-sizing: border-box;
          }

          .box-title {
            font-size: 18px;
            font-weight: 900;
            text-align: center;
            text-decoration: underline;
            margin-bottom: 20px;
          }

          .line {
            margin-bottom: 20px;
          }

          .label {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 4px;
            text-transform: uppercase;
          }

          .value {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.3;
            word-break: break-word;
          }

          .small {
            font-size: 20px;
          }

          .bottom-grid {
            display: flex;
            gap: 18px;
            margin-bottom: 18px;
          }

          .small-box {
            flex: 1;
            border: 2px solid #111;
            padding: 14px;
            min-height: 85px;
            box-sizing: border-box;
          }

          .warning {
            border: 3px solid #111;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }

          .warning-title {
            font-size: 26px;
            font-weight: 900;
            margin-bottom: 18px;
          }

          .warning-sub {
            font-size: 16px;
            font-weight: 700;
            text-decoration: underline;
            line-height: 1.5;
          }

          .fragil {
            width: 170px;
            height: 170px;
            border: 3px solid #111;
            background: #d60000;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            text-align: center;
            box-sizing: border-box;
          }

          .fragil-top {
            font-size: 38px;
            margin-bottom: 10px;
          }

          .fragil-icon {
            font-size: 70px;
            line-height: 1;
          }

          .fragil-bottom {
            font-size: 34px;
            margin-top: 10px;
          }

          .obs {
            margin-top: 18px;
            border: 2px dashed #111;
            padding: 12px;
          }

          .obs-title {
            font-size: 16px;
            font-weight: 900;
            margin-bottom: 8px;
          }

          .obs-text {
            font-size: 16px;
            line-height: 1.5;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="sheet">

          <div class="etiqueta">

            <div class="top">

              <div class="logo">
                INSOR
              </div>

              <div class="empresa">
                INSOR INTERNACIONAL SAS
              </div>

              <div class="fecha">
                <div class="fecha-title">FECHA</div>
                <div class="fecha-value">${fecha}</div>
              </div>

            </div>

            <div class="middle">

              <div class="box">

                <div class="box-title">
                  REMITENTE
                </div>

                <div class="line">
                  <div class="value">
                    INSOR INTERNACIONAL SAS
                  </div>
                </div>

                <div class="line">
                  <div class="value small">
                    AV. GENERAL FLORES 3289, MVD
                  </div>
                </div>

                <div class="line">
                  <div class="value small">
                    2203 7185
                  </div>
                </div>

                <div class="line">
                  <div class="value small">
                    RUT 219 728 700 011
                  </div>
                </div>

              </div>

              <div class="box">

                <div class="box-title">
                  DESTINATARIO
                </div>

                <div class="line">
                  <div class="label">Cliente</div>
                  <div class="value">
                    ${pedido.cliente || "-"}
                  </div>
                </div>

                <div class="line">
                  <div class="label">Dirección</div>
                  <div class="value small">
                    ${pedido.direccion || "-"}
                  </div>
                </div>

                <div class="line">
                  <div class="label">Teléfono</div>
                  <div class="value small">
                    ${pedido.telefono_cliente || "-"}
                  </div>
                </div>

                <div class="line">
                  <div class="label">Departamento</div>
                  <div class="value small">
                    ${pedido.departamento || "-"}
                  </div>
                </div>

              </div>

            </div>

            <div class="bottom-grid">

              <div class="small-box">
                <div class="label">Agencia</div>
                <div class="value small">
                  __________________
                </div>
              </div>

              <div class="small-box">
                <div class="label">Cantidad de bultos</div>
                <div class="value small">
                  ________
                </div>
              </div>

            </div>

            <div class="warning">

              <div>

                <div class="warning-title">
                  MANIPULAR MERCADERÍA CON PRECAUCIÓN
                </div>

                <div class="warning-sub">
                  CUALQUIER PROBLEMA RELACIONADO CON LA MERCADERÍA<br/>
                  COMUNICARSE DIRECTAMENTE CON LOGÍSTICA: 097 995 530
                </div>

              </div>

              <div class="fragil">
                <div class="fragil-top">
                  CUIDADO
                </div>

                <div class="fragil-icon">
                  🍷
                </div>

                <div class="fragil-bottom">
                  FRÁGIL
                </div>
              </div>

            </div>

            ${
              pedido.observaciones
                ? `
                  <div class="obs">
                    <div class="obs-title">
                      OBSERVACIONES
                    </div>

                    <div class="obs-text">
                      ${pedido.observaciones}
                    </div>
                  </div>
                `
                : ""
            }

          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>

      </body>
    </html>
  `);

  ventana.document.close();
} 

  const pedidoSeleccionado = useMemo(() => {
    return entregas.find((e) => e.id === seleccionadoId) || null;
  }, [entregas, seleccionadoId]);

  const filtradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return entregas.filter(
      (e) =>
        e.cliente?.toLowerCase().includes(texto) ||
        e.numero_factura?.toLowerCase().includes(texto) ||
        e.telefono_cliente?.toLowerCase().includes(texto) ||
        e.direccion?.toLowerCase().includes(texto) ||
        e.departamento?.toLowerCase().includes(texto)
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
                Gestión de pedidos, reparto, clientes y etiquetas
              </p>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente, factura, teléfono o dirección..."
              className="bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 w-full lg:w-96"
            />
          </div>

          {mensaje && (
            <div className="bg-cyan-500/20 border border-cyan-500 text-cyan-100 px-5 py-4 rounded-2xl mb-6">
              {mensaje}
            </div>
          )}

          {pedidoSeleccionado && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-400">Pedido seleccionado</p>
                <p className="text-xl font-bold">
                  {pedidoSeleccionado.cliente} · Factura {pedidoSeleccionado.numero_factura}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Boton texto="✏️ Editar seleccionado" color="bg-slate-500" onClick={() => setEditando(pedidoSeleccionado)} />
                <Boton texto="↩️ Restaurar a entregar" color="bg-cyan-500" onClick={() => cambiarEstado(pedidoSeleccionado.id, "a_entregar")} />
                <Boton texto="🏷️ Imprimir etiqueta" color="bg-purple-500" onClick={() => imprimirEtiqueta(pedidoSeleccionado)} />
              </div>
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

              <Input placeholder="Teléfono cliente" value={telefono} onChange={setTelefono} />
              <Input placeholder="Dirección" value={direccion} onChange={setDireccion} />
              <Input placeholder="Departamento" value={departamento} onChange={setDepartamento} />
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
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
                <Boton texto="🏷️ Etiqueta" color="bg-purple-500" onClick={() => imprimirEtiqueta(e)} />
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
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
            acciones={(e) => (
              <div className="flex gap-2 flex-wrap">
                <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
                <Boton texto="🏷️ Etiqueta" color="bg-purple-500" onClick={() => imprimirEtiqueta(e)} />
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
              seleccionadoId={seleccionadoId}
              onSeleccionar={setSeleccionadoId}
              acciones={(e) => (
                <div className="flex gap-2 flex-wrap">
                  <Boton texto="✏️ Editar" color="bg-slate-500" onClick={() => setEditando(e)} />
                  <Boton texto="🏷️ Etiqueta" color="bg-purple-500" onClick={() => imprimirEtiqueta(e)} />
                  <Boton texto="↩️ Restaurar" color="bg-cyan-500" onClick={() => cambiarEstado(e.id, "a_entregar")} />
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
            seleccionadoId={seleccionadoId}
            onSeleccionar={setSeleccionadoId}
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
      departamento: encontrado?.departamento || pedido.departamento || "",
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

          <Input value={pedido.telefono_cliente || ""} onChange={(v) => setPedido({ ...pedido, telefono_cliente: v })} placeholder="Teléfono cliente" />
          <Input value={pedido.direccion || ""} onChange={(v) => setPedido({ ...pedido, direccion: v })} placeholder="Dirección" />
          <Input value={pedido.departamento || ""} onChange={(v) => setPedido({ ...pedido, departamento: v })} placeholder="Departamento" />
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
  seleccionadoId,
  onSeleccionar,
}: {
  titulo: string;
  color: string;
  entregas: Entrega[];
  fechaUY: (fecha?: string | null) => string;
  usd: (valor: number) => string;
  acciones: (e: Entrega) => ReactNode;
  seleccionadoId: number | null;
  onSeleccionar: (id: number | null) => void;
}) {
  return (
    <section className={`bg-slate-900 border ${color} rounded-3xl p-6 mb-8`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <p className="text-slate-400">{entregas.length} pedidos</p>
      </div>

      <TablaEntregas
        entregas={entregas}
        fechaUY={fechaUY}
        usd={usd}
        acciones={acciones}
        seleccionadoId={seleccionadoId}
        onSeleccionar={onSeleccionar}
      />
    </section>
  );
}

function TablaEntregas({
  entregas,
  fechaUY,
  usd,
  acciones,
  seleccionadoId,
  onSeleccionar,
}: {
  entregas: Entrega[];
  fechaUY: (fecha?: string | null) => string;
  usd: (valor: number) => string;
  acciones: (e: Entrega) => ReactNode;
  seleccionadoId: number | null;
  onSeleccionar: (id: number | null) => void;
}) {
  return (
    <div className="overflow-auto">
      <table className="w-full min-w-[1200px]">
        <thead>
          <tr className="text-left border-b border-slate-800 text-slate-400">
            <th className="pb-4">Sel.</th>
            <th className="pb-4">Cliente</th>
            <th className="pb-4">Factura</th>
            <th className="pb-4">Entrega</th>
            <th className="pb-4">Prioridad</th>
            <th className="pb-4">Monto</th>
            <th className="pb-4">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {entregas.map((e) => (
            <tr key={e.id} className="border-b border-slate-800">
              <td className="py-5">
                <input
                  type="checkbox"
                  checked={seleccionadoId === e.id}
                  onChange={(ev) => onSeleccionar(ev.target.checked ? e.id : null)}
                  className="h-5 w-5"
                />
              </td>

              <td className="py-5 font-semibold">
                <div>{e.cliente}</div>
                <div className="text-xs text-slate-500">{e.telefono_cliente || ""}</div>
                <div className="text-xs text-slate-500">{e.direccion || ""}</div>
                <div className="text-xs text-slate-500">{e.departamento || ""}</div>

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