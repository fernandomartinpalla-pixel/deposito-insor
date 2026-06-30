"use client";

import { useState } from "react";

type Props = {
  mensaje: string;
  onLogin: (email: string, password: string) => void;
};

export default function LoginScreen({ mensaje, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 w-full max-w-lg text-white shadow-2xl">
        <p className="text-cyan-400 tracking-[0.4em] text-sm mb-3">
          ACCESO PRIVADO
        </p>

        <h1 className="text-5xl font-bold mb-5">📦 Depósito Insor</h1>

        <p className="text-slate-400 mb-8">
          Ingresá con usuario autorizado para gestionar pedidos, reparto,
          historial y etiquetas.
        </p>

        {mensaje && (
          <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-2xl mb-6">
            {mensaje}
          </div>
        )}

        <div className="space-y-5">
          <Input
            placeholder="Email"
            value={email}
            onChange={setEmail}
          />

          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={setPassword}
          />

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

function Input({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder?: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 w-full outline-none focus:border-cyan-500"
    />
  );
}