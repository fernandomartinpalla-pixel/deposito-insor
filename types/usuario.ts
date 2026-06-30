export type RolUsuario =
  | "admin"
  | "lectura";

export interface UsuarioSistema {
  email: string;
  rol: RolUsuario;
}