export function fechaUY(fecha?: string | null) {
  if (!fecha) return "-";

  const limpia = fecha.slice(0, 10);
  const [y, m, d] = limpia.split("-");

  return `${d}/${m}/${y}`;
}

export function usd(valor: number) {
  return `USD ${Number(valor || 0).toFixed(2)}`;
}

export function proximoMes(mes: string) {
  const [anio, mesNum] = mes.split("-").map(Number);
  const fecha = new Date(anio, mesNum, 1);
  return fecha.toISOString().slice(0, 10);
}