// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { children: React.ReactNode };

export function ProtectedRoute({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setAllowed(true);
      } else {
        setAllowed(false);
        window.location.href = "/login";
      }
      setChecking(false);
    };
    check();
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui,sans-serif",
          color: "#6b7280",
        }}
      >
        Verificando acceso...
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
