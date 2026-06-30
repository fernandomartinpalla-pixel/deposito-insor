import { supabase } from "@/lib/supabase";
import { Cliente } from "@/types/cliente";

export async function cargarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  if (error) {
    throw error;
  }

  return (data || []) as Cliente[];
}

export async function buscarCliente(
  texto: string
): Promise<Cliente | null> {

  if (texto.trim().length < 2) return null;

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .ilike("nombre", `%${texto}%`)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function guardarCliente(cliente: {
  nombre: string;
  telefono?: string;
  direccion?: string;
  departamento?: string;
}) {

  const { error } = await supabase
    .from("clientes")
    .upsert(
      [
        {
          nombre: cliente.nombre,
          telefono: cliente.telefono || null,
          direccion: cliente.direccion || null,
          departamento: cliente.departamento || null,
        },
      ],
      {
        onConflict: "nombre",
      }
    );

  if (error) {
    throw error;
  }
}