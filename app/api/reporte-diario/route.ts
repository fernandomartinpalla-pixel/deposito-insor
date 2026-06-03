import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

function fechaHoyUruguay() {
  const ahora = new Date();

  const uruguay = new Date(
    ahora.toLocaleString("en-US", {
      timeZone: "America/Montevideo",
    })
  );

  return uruguay.toISOString().slice(0, 10);
}

function fechaUY(fechaIso: string) {
  const [y, m, d] = fechaIso.split("-");
  return `${d}/${m}/${y}`;
}

export async function GET() {
  try {
    const fecha = fechaHoyUruguay();

    const { data, error } = await supabase
      .from("entregas")
      .select("*")
      .eq("activo", true)
      .eq("fecha_entregado", fecha)
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const entregas = data || [];

    let cuerpo = "";

    if (entregas.length === 0) {
      cuerpo = "No hubieron entregas en el día de hoy.";
    } else {
      cuerpo = `Reporte de entregas del día ${fechaUY(fecha)}\n\n`;

      entregas.forEach((e, index) => {
        cuerpo += `${index + 1}. Cliente: ${e.cliente}\n`;
        cuerpo += `Factura: ${e.numero_factura}\n`;
        cuerpo += `Monto: $ ${Number(e.monto).toFixed(2)}\n`;
        cuerpo += `Observaciones: ${e.observaciones || "-"}\n\n`;
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.REPORTE_DESTINO,
      subject: `Reporte diario Depósito Insor - ${fechaUY(fecha)}`,
      text: cuerpo,
    });

    return NextResponse.json({
      ok: true,
      entregas: entregas.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}