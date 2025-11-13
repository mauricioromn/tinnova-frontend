// src/App.tsx
import React, { useState } from "react";
import { supabase } from "./lib/supabaseClient";

/**
 * URL del backend:
 * - Producción: VITE_API_URL=https://api.tinnova.pe
 * - Local: VITE_API_URL=http://localhost:8000
 */
const API_URL = import.meta.env.VITE_API_URL || "https://api.tinnova.pe";
console.log("API_URL en runtime:", API_URL);

/** Logo (coloca logo.png en /public) */
const LOGO_URL = "/logo.png";

type SimilarItem = {
  filename: string;
  similitud: number;
  url: string;
  precio_unitario_estimado?: number | null;
  descripcion_sugerida?: string | null;
};

type ResultadoBusqueda = { resultados: SimilarItem[] };

type CartItem = {
  filename: string;
  cantidad: number;
  descripcion: string;
  precio_unitario?: number;
  is_custom?: boolean;
  custom_filename?: string;
};

/* ===== Estilos base ===== */
const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e7eb",
  borderRadius: 16,
  padding: 16,
};

const input: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #e6e7eb",
  padding: "0 12px",
  background: "#fff",
};

const textArea: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  borderRadius: 12,
  border: "1px solid #e6e7eb",
  padding: 12,
  resize: "vertical",
  background: "#fff",
};

const btn: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

export default function App() {
  // Upload & preview
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Búsqueda
  const [resultados, setResultados] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [perCardDesc, setPerCardDesc] = useState<Record<string, string>>({});
  const [mensajeResultados, setMensajeResultados] = useState<string | null>(null);

  // Carrito
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  // Datos cliente
  const [cliente, setCliente] = useState("");
  const [contacto, setContacto] = useState("");
  const [ruc, setRuc] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState("");
  const [tiempoProd, setTiempoProd] = useState("");
  const [condPago, setCondPago] = useState("");
  const [entrega, setEntrega] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [igvPct, setIgvPct] = useState(18);
  const [moneda, setMoneda] = useState("S/");
  const [cotizadoPor, setCotizadoPor] = useState("");

  // PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // “Mi imagen”
  const [miDesc, setMiDesc] = useState("");
  const [miCantidad, setMiCantidad] = useState("");
  const [miPU, setMiPU] = useState("");

  // Header
  const [logoError, setLogoError] = useState(false);

  /* ===== Logout Supabase ===== */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    } finally {
      window.location.href = "/login";
    }
  };

  const onFileChange = (f: File | null) => {
    setFile(f);
    setResultados([]);
    setPerCardDesc({});
    setMensajeResultados(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  };

  /* =======================
     BUSCAR SIMILARES
  ======================== */
  const buscarSimilares = async () => {
    if (!file) return alert("Sube una imagen primero");

    setLoading(true);
    setMensajeResultados(null);
    setResultados([]);

    try {
      const form = new FormData();
      form.append("imagen", file);
      form.append("top_k", "8");

      const url = `${API_URL}/buscar-similares-imagen`;
      console.log("👉 Enviando a:", url);

      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      console.log("👉 Respuesta HTTP:", res.status);

      if (!res.ok) {
        const txt = await res.text();
        console.error("❌ Error backend buscar-similares-imagen:", txt);
        setMensajeResultados("Error al buscar similares.");
        return;
      }

      const data: ResultadoBusqueda = await res.json();
      console.log("✅ Data recibida:", data);

      const lista = data.resultados || [];

      if (lista.length === 0) {
        setResultados([]);
        setMensajeResultados(
          "No se encontraron coincidencias para esta imagen."
        );
        return;
      }

      const mapaDescripciones: Record<string, string> = {};
      lista.forEach((r) => {
        mapaDescripciones[r.filename] = r.descripcion_sugerida || "";
      });

      setPerCardDesc(mapaDescripciones);
      setResultados(lista);
    } catch (e) {
      console.error("❌ Error buscando similares:", e);
      setMensajeResultados(
        "Ocurrió un error buscando similares. Revisa la consola."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     AGREGAR AL CARRITO
  ======================== */
  const agregarAlCarrito = (r: SimilarItem) => {
    const cantidadStr = prompt("Cantidad:", "100");
    if (!cantidadStr) return;
    const cantidad = Number(cantidadStr);
    if (!cantidad || cantidad <= 0) return alert("Cantidad inválida");

    let pu: number | undefined = undefined;
    const basePU = r.precio_unitario_estimado ?? undefined;

    const puStr = prompt(
      `Precio unitario (Enter para usar ${
        basePU != null ? "S/ " + basePU.toFixed(2) : "—"
      })`,
      basePU != null ? String(basePU) : ""
    );

    if (puStr && puStr.trim() !== "") {
      const n = Number(puStr);
      if (!isFinite(n) || n < 0) return alert("P.U. inválido");
      pu = n;
    } else {
      pu = basePU;
    }

    const desc = (perCardDesc[r.filename] ?? r.descripcion_sugerida ?? "").trim();

    setCarrito((s) => [
      ...s,
      { filename: r.filename, cantidad, descripcion: desc, precio_unitario: pu },
    ]);
  };

  /* =======================
     USAR MI IMAGEN COMO ITEM
  ======================== */
  const usarMiImagenComoItem = async () => {
    if (!file) return alert("Primero sube una imagen");
    if (!miDesc.trim()) return alert("Ingresa una descripción");
    const c = Number(miCantidad);
    const pu = Number(miPU);
    if (!c || c <= 0) return alert("Cantidad inválida");
    if (!isFinite(pu) || pu < 0) return alert("P.U. inválido");

    try {
      const form = new FormData();
      form.append("imagen", file);

      const res = await fetch(`${API_URL}/subir-imagen-custom`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setCarrito((s) => [
        ...s,
        {
          filename: data.filename,
          custom_filename: data.filename,
          cantidad: c,
          descripcion: miDesc.trim(),
          precio_unitario: pu,
          is_custom: true,
        },
      ]);

      setMiDesc("");
      setMiCantidad("");
      setMiPU("");
    } catch {
      alert("No se pudo usar tu imagen como ítem.");
    }
  };

  /* =======================
     GENERAR PROFORMA
  ======================== */
  const generarProforma = async () => {
    if (carrito.length === 0) return alert("Agrega al menos un item");
    if (!cliente.trim()) return alert("Ingresa el nombre del cliente");

    const payload = {
      datos: {
        cliente,
        contacto: contacto || undefined,
        ruc: ruc || undefined,
        direccion: direccion || undefined,
        fecha: fecha || undefined,
        tiempo_produccion: tiempoProd || undefined,
        condiciones_pago: condPago || undefined,
        entrega: entrega || undefined,
        observaciones: observaciones || undefined,
        igv_porcentaje: Number(igvPct),
        moneda,
        cotizado_por: cotizadoPor || undefined,
      },
      items: carrito.map((c) => ({
        filename: c.filename,
        cantidad: c.cantidad,
        descripcion: c.descripcion,
        precio_unitario_override:
          c.precio_unitario != null ? Number(c.precio_unitario) : undefined,
        is_custom: !!c.is_custom,
        custom_filename: c.is_custom ? c.custom_filename : undefined,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/generar-proforma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return alert("No se pudo generar la proforma");

      const data = await res.json();
      setPdfUrl(`${API_URL}${data.pdf_url}`);
      alert(`Proforma ${data.numero} generada`);
    } catch {
      alert("Error al generar la proforma");
    }
  };

  /* ============================================================
     RENDER PRINCIPAL
  ============================================================ */
  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      {/* HEADER */}
      <header
        style={{
          padding: "16px 24px",
          background: "#0f172a",
          color: "#e5e7eb",
          borderBottom: "1px solid #0b1223",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#ffffff",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                padding: 6,
              }}
            >
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="Tinnova"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div style={{ fontWeight: 900, fontSize: 24 }}>T</div>
              )}
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>
                Tinnova — Cotizador
              </div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>
                Búsqueda visual + Proformas PDF
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          maxWidth: 1200,
          margin: "20px auto",
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "minmax(520px, 560px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* IZQUIERDA */}
        <div style={{ display: "grid", gap: 16 }}>
          <section style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>
              1) Buscar imágenes similares
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />

            {previewUrl && (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  border: "1px solid #eef0f3",
                  padding: 8,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  background: "#fafafa",
                }}
              >
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 12,
                    objectFit: "cover",
                  }}
                />
                <div style={{ fontSize: 12, color: "#374151" }}>
                  <div>
                    <b>Imagen subida</b>
                  </div>
                  <div>{file?.name}</div>
                </div>
              </div>
            )}

            <button style={btn} onClick={buscarSimilares} disabled={loading}>
              {loading ? "Buscando..." : "Buscar similares"}
            </button>
          </section>
        </div>

        {/* DERECHA — RESULTADOS */}
        <section style={{ ...card, minHeight: 400 }}>
          <div style={{ fontWeight: 800, marginBottom: 12 }}>Resultados</div>

          {mensajeResultados && (
            <div
              style={{
                marginBottom: 8,
                padding: 8,
                borderRadius: 8,
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: 12,
              }}
            >
              {mensajeResultados}
            </div>
          )}

          {!mensajeResultados && resultados.length === 0 && (
            <div style={{ color: "#6b7280" }}>
              Sube una imagen y busca para ver coincidencias.
            </div>
          )}

          {/* TARJETAS DE RESULTADOS */}
          <div style={{ display: "grid", gap: 12 }}>
            {resultados.map((item, idx) => (
              <div
                key={item.filename + idx}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                }}
              >
                {/* Imagen */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    background: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={`${API_URL}${item.url}`}
                    alt={item.descripcion_sugerida || item.filename}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </div>

                {/* Información */}
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {item.filename}
                  </div>

                  <div style={{ fontWeight: 600, marginTop: 4 }}>
                    {item.descripcion_sugerida || "Sin descripción"}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: "#374151",
                      fontSize: 13,
                      display: "flex",
                      gap: 16,
                    }}
                  >
                    <div>
                      Similitud:{" "}
                      <b>{(item.similitud * 100).toFixed(1)}%</b>
                    </div>

                    <div>
                      Precio estimado:{" "}
                      {item.precio_unitario_estimado != null ? (
                        <b>S/ {item.precio_unitario_estimado.toFixed(2)}</b>
                      ) : (
                        <i>No disponible</i>
                      )}
                    </div>
                  </div>

                  <button
                    style={{
                      marginTop: 8,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #0f172a",
                      background: "white",
                      color: "#0f172a",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                    onClick={() => agregarAlCarrito(item)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
        © {new Date().getFullYear()} Tinnova S.A.C. — www.tinnova.promo
      </footer>
    </div>
  );
}

