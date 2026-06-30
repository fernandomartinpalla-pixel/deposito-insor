export interface Cliente {
  id: number;

  nombre: string;

  telefono?: string | null;

  direccion?: string | null;

  departamento?: string | null;

  created_at?: string;
}