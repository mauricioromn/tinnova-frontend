// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Protege rutas como /app
 * - Si hay sesión válida en Supabase → deja pasar
 * - Si NO hay sesión → redirige a /login
 */
type Props = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error verificando sesión:", error);

        if (data?.session) {
          // ✅ Sesión válida
          setAllowed(true);
        } else {
          // ❌ Sin sesión → redirigir
          setAllowed(false);
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err);
        setAllowed(false);
        window.location.href = "/login";
      } finally {
        setChecking(false);
      }
    };

    verifySession();
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#6b7280",
        }}
      >
        Verificando acceso...
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
