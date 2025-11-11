// src/components/RequireAuth.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        // 1) Leer sesión actual
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error al obtener sesión:", error);
        }

        const hasSession = !!data.session;

        if (isMounted) {
          if (!hasSession) {
            setIsAuth(false);
            // Si no hay sesión → mandar al login
            navigate("/", { replace: true });
          } else {
            setIsAuth(true);
          }
        }

        // 2) Escuchar cambios de sesión (logout / login desde otro lado)
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return;
          const loggedIn = !!session;
          setIsAuth(loggedIn);
          if (!loggedIn) {
            navigate("/", { replace: true });
          }
        });

        return () => {
          isMounted = false;
          subscription.unsubscribe();
        };
      } catch (e) {
        console.error("Error en RequireAuth:", e);
        if (isMounted) {
          setIsAuth(false);
          navigate("/", { replace: true });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkSession();
  }, [navigate]);

  if (loading) {
    // Pantalla de carga simple mientras se valida la sesión
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020817",
          color: "#9ca3af",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, -apple-system, sans-serif",
        }}
      >
        Verificando acceso...
      </div>
    );
  }

  if (!isAuth) {
    // Si no está autenticado, ya lo estamos redirigiendo en useEffect.
    return null;
  }

  // Si está autenticado, mostramos el contenido protegido
  return <>{children}</>;
}
