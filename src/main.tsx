// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LoginPage from "./pages/Login";
import { supabase } from "./lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

function Root() {
  const [loading, setLoading] = React.useState(true);
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    // Cargar sesión actual al arrancar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    // Escuchar cambios de sesión (logout/login en otra pestaña, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Pantalla de carga sencilla (puedes personalizarla)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#e5e7eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Cargando…
      </div>
    );
  }

  const path = window.location.pathname;

  // Rutas que queremos proteger con login
  const isProtected = path === "/" || path === "/app";

  // Si NO hay sesión y la ruta es protegida → mandar a /login
  if (!session && isProtected) {
    const redirectTarget = encodeURIComponent(
      window.location.pathname + window.location.search || "/app"
    );
    window.location.replace(`/login?redirect=${redirectTarget}`);
    return null;
  }

  // Ruta de login: siempre muestra el formulario
  if (path.startsWith("/login")) {
    return <LoginPage />;
  }

  // Cualquier otra ruta (/, /app, etc.) → app del cotizador
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
