// src/pages/Login.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LOGO_URL = "/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !pass) {
      setErrorMsg("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error || !data.session) {
        console.error(error);
        setErrorMsg("Credenciales inválidas o no autorizado.");
        return;
      }

      // ======================================
      // 🔁 Manejo del parámetro redirect
      // Ej: /login?redirect=/app
      // ======================================
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/app";

      window.location.href = redirect;

    } catch (err) {
      console.error(err);
      setErrorMsg("Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 18px 60px rgba(15,23,42,0.32)",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "grid",
            placeItems: "center",
            marginBottom: 16,
            gap: 8,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: "#0f172a",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={LOGO_URL}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              alt="Tinnova"
              style={{ width: "70%", height: "70%", objectFit: "contain" }}
            />
          </div>

          <div
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: "#111827",
              textAlign: "center",
            }}
          >
            Portal Tinnova
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            Acceso exclusivo para usuarios autorizados.
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Correo autorizado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                fontSize: 12,
                color: "#b91c1c",
                background: "#fef2f2",
                borderRadius: 10,
                padding: "6px 8px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "11px 16px",
              borderRadius: 14,
              border: "none",
              background: "#0f172a",
              color: "#f9fafb",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {loading ? "Validando..." : "Ingresar"}
          </button>
        </form>

        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Si necesitas acceso, solicita que tu correo sea invitado por el administrador.
        </div>
      </div>
    </div>
  );
}
