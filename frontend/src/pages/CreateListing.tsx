import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  createListing,
  publishListing,
  uploadListingImages,
  getPriceSuggestion,
  type PriceBreakdownResponse,
} from "../api/listings";

// Helper: compress image client-side before upload
async function compressImage(file: File, maxPx = 1200, quality = 0.75): Promise<File> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (b) => {
          if (!b) return res(file);
          const compressedFile = new File(
            [b],
            file.name.replace(/\.[^/.]+$/, "") + ".webp",
            { type: "image/webp" }
          );
          res(compressedFile);
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => res(file);
    img.src = URL.createObjectURL(file);
  });
}

type Complexity = "low" | "medium" | "high" | "very_high";

const CRAFT_OPTIONS = [
  { key: "weaving", label: "Weaving & Handloom", desc: "Ikat, Jamdani, Kasuti, Shawls, Silk" },
  { key: "pottery", label: "Pottery & Terracotta", desc: "Clayware, Studio Ceramics, Terracotta" },
  { key: "wood_carving", label: "Wood Carving", desc: "Channapatna, Teak, Driftwood, Inlay" },
  { key: "dhokra", label: "Metal Casting & Filigree", desc: "Lost-wax Dhokra, Bidriware, Brass" },
  { key: "embroidery", label: "Needlework & Embroidery", desc: "Chikan, Phulkari, Kantha, Mirrorwork" },
  { key: "painting", label: "Traditional Painting", desc: "Madhubani, Pattachitra, Miniature, Warli" },
  { key: "jewellery", label: "Artisanal Jewellery", desc: "Kundan, Meenakari, Tribal silver, Terracotta" },
  { key: "other", label: "Other Indigenous Craft", desc: "Bamboo, Cane, Stone carving, Natural fibers" },
];

const STEPS = [
  { id: 1, label: "Photography" },
  { id: 2, label: "Classification" },
  { id: 3, label: "Details & Story" },
  { id: 4, label: "Craftsmanship" },
  { id: 5, label: "Fair Pricing" },
];

function useLocalDraft<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v: T) => {
    setVal(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* quota */
    }
  };
  return [val, set];
}

// ── Sidebar helpers matching Dashboard.tsx ──────────────────────────
function NavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0.55rem 0.875rem",
        border: "none",
        background: active ? "var(--linen, #E8E2D8)" : "transparent",
        color: active ? "var(--charcoal, #1C1C1A)" : "var(--graphite, #4A4740)",
        fontWeight: active ? 600 : 400,
        fontSize: "0.9rem",
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        borderRadius: "6px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 150ms, color 150ms",
      }}
    >
      <span>{label}</span>
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.6875rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--stone, #7A7570)",
        padding: "0.75rem 0.875rem 0.25rem",
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        height: "1px",
        background: "var(--linen, #E8E2D8)",
        margin: "0.75rem 0.5rem",
      }}
    />
  );
}

export default function CreateListing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Form fields
  const [photoFile, setPhotoFile] = useLocalDraft<any>("cl_photo", null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [craftType, setCraftType] = useLocalDraft<string>("cl_craft", "");
  const [title, setTitle] = useLocalDraft<string>("cl_title", "");
  const [description, setDescription] = useLocalDraft<string>("cl_desc", "");
  const [materials, setMaterials] = useLocalDraft<string>("cl_materials", "");
  const [hours, setHours] = useLocalDraft<number>("cl_hours", 8);
  const [materialCost, setMaterialCost] = useLocalDraft<number>("cl_mat_cost", 500);
  const [complexity, setComplexity] = useLocalDraft<Complexity>("cl_complexity", "medium");
  const [priceResult, setPriceResult] = useState<PriceBreakdownResponse | null>(null);
  const [finalPrice, setFinalPrice] = useLocalDraft<number>("cl_price", 0);
  const [stock, setStock] = useState<number>(1);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const toggleRecording = () => {
    if (!SpeechRecognition) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const r = new SpeechRecognition();
      const langMap: Record<string, string> = { kn: "kn-IN", hi: "hi-IN", en: "en-IN" };
      r.lang = langMap[i18n.language] || "en-IN";
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onstart = () => setIsRecording(true);
      r.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setDescription(description ? `${description} ${transcript}` : transcript);
      };
      r.onerror = () => setIsRecording(false);
      r.onend = () => setIsRecording(false);
      recognitionRef.current = r;
      r.start();
    } catch {
      setIsRecording(false);
    }
  };

  const canAdvance = (): boolean => {
    if (step === 1) return true; // Photography can be optional or uploaded
    if (step === 2) return Boolean(craftType);
    if (step === 3) return title.trim().length >= 3;
    if (step === 4) return hours >= 1;
    if (step === 5) return finalPrice > 0;
    return true;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      setPhotoPreview(url);
      setPhotoFile(compressed);
    } catch {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setPhotoFile(file);
    }
  };

  const handleGetPriceEstimate = async () => {
    if (!craftType) return;
    setLoading(true);
    setError("");
    try {
      const res = await getPriceSuggestion({
        craft_type: craftType,
        hours_to_make: hours,
        materials_cost: materialCost,
        technique_complexity: complexity,
      });
      setPriceResult(res);
      setFinalPrice(res.suggested_price);
    } catch {
      setError(
        t(
          "artisan.price_error",
          "Could not calculate automated pricing. You may specify your price manually below."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 5 && !priceResult && craftType) {
      handleGetPriceEstimate();
    }
  }, [step, craftType]);

  const handleSaveDraft = async () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 3000);
    if (!craftType || !title) return;
    try {
      await createListing({
        craft_type: craftType,
        title: title || "Draft",
        description,
        materials,
        hours_to_make: hours,
        price_inr: finalPrice || 1,
        stock,
      });
    } catch {
      /* local draft preserved */
    }
  };

  const handleSubmit = async () => {
    if (!craftType || !title || !finalPrice) {
      setError(t("artisan.fill_required", "Please complete all required fields."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const listing = await createListing({
        craft_type: craftType,
        title,
        description,
        materials,
        hours_to_make: hours,
        price_inr: finalPrice,
        stock,
      });

      if (photoFile && typeof photoFile === "object" && (photoFile as File).size) {
        try {
          await uploadListingImages(listing.id, [photoFile as File]);
        } catch {
          /* optional upload */
        }
      }

      await publishListing(listing.id);

      // Clear draft keys
      [
        "cl_photo",
        "cl_craft",
        "cl_title",
        "cl_desc",
        "cl_materials",
        "cl_hours",
        "cl_mat_cost",
        "cl_complexity",
        "cl_price",
      ].forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          /* */
        }
      });

      navigate("/dashboard", { state: { published: true } });
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          t("artisan.publish_error", "An error occurred while publishing. Your draft is preserved.")
      );
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) {
      navigate("/dashboard");
      return;
    }
    setStep((s) => s - 1);
  };

  const goNext = () => setStep((s) => s + 1);

  // ── Layout styles matching Dashboard.tsx ──────────────────────────
  const shellStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    background: "var(--warm-white, #FDFBF7)",
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
    minHeight: "calc(100vh - 72px)",
  };

  const sidebarStyle: React.CSSProperties = {
    width: "220px",
    flexShrink: 0,
    borderRight: "1px solid var(--linen, #E8E2D8)",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
    background: "var(--warm-white, #FDFBF7)",
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: "2.5rem 2rem 4rem",
    maxWidth: "840px",
    overflowY: "auto",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 0.95rem",
    border: "1.5px solid var(--fog, #D4CEC5)",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    color: "var(--charcoal, #1C1C1A)",
    background: "var(--warm-white, #FDFBF7)",
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 180ms",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--graphite, #4A4740)",
    marginBottom: "0.4rem",
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
  };

  return (
    <div style={shellStyle} role="main" aria-label="Create new listing">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside style={sidebarStyle} aria-label="Dashboard navigation">
        <div style={{ marginBottom: "1.75rem", paddingLeft: "0.5rem" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "1.1rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--charcoal, #1C1C1A)",
              }}
            >
              KAARIGAR
            </div>
          </Link>
          <div
            style={{
              fontSize: "0.6875rem",
              color: "var(--stone, #7A7570)",
              marginTop: "0.2rem",
              fontWeight: 400,
            }}
          >
            Artisan Studio
          </div>
        </div>

        <SectionHeading>Dashboard</SectionHeading>
        <NavItem label="Overview" active={false} onClick={() => navigate("/dashboard")} />
        <NavItem label="Orders" active={false} onClick={() => navigate("/dashboard")} />
        <NavItem label="Listings" active={false} onClick={() => navigate("/dashboard")} />
        <NavItem label="Profile" active={false} onClick={() => navigate("/dashboard")} />

        <Divider />

        <NavItem label="Add listing" active={true} onClick={() => {}} />
        <NavItem label="Custom orders" active={false} onClick={() => navigate("/commissions")} />
        <NavItem label="View storefront" active={false} onClick={() => navigate("/gallery")} />

        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              width: "100%",
              padding: "0.6rem 0.875rem",
              border: "none",
              background: "transparent",
              color: "var(--stone, #7A7570)",
              fontSize: "0.9rem",
              fontFamily: "var(--font-ui, system-ui, sans-serif)",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: "6px",
              transition: "color 160ms",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main style={mainStyle}>
        {/* Breadcrumb / Back button */}
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            onClick={goBack}
            style={{
              background: "none",
              border: "none",
              color: "var(--stone, #7A7570)",
              fontSize: "0.85rem",
              cursor: "pointer",
              padding: "0",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "var(--font-ui, system-ui, sans-serif)",
            }}
          >
            &larr; {step === 1 ? "Back to Dashboard" : "Previous step"}
          </button>
        </div>

        {/* Page Title */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "1.875rem",
                fontWeight: 600,
                color: "var(--charcoal, #1C1C1A)",
                margin: "0 0 0.35rem",
              }}
            >
              Add New Craft Object
            </h1>
            <p
              style={{
                margin: 0,
                color: "var(--stone, #7A7570)",
                fontSize: "0.9375rem",
                fontFamily: "var(--font-ui, system-ui, sans-serif)",
              }}
            >
              Document your craft heritage, fair hourly craftsmanship, and authentic provenance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "6px",
              border: "1.5px solid var(--fog, #D4CEC5)",
              background: "transparent",
              color: "var(--graphite, #4A4740)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 150ms",
            }}
          >
            {draftSavedToast ? "Draft saved" : "Save draft"}
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.5rem",
            marginBottom: "2.5rem",
            borderBottom: "1px solid var(--linen, #E8E2D8)",
            paddingBottom: "1.25rem",
          }}
        >
          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (isCompleted) setStep(s.id);
                }}
                disabled={!isCompleted && !isCurrent}
                style={{
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  padding: "0.25rem",
                  cursor: isCompleted ? "pointer" : "default",
                  opacity: !isCompleted && !isCurrent ? 0.45 : 1,
                }}
              >
                <div
                  style={{
                    height: "3px",
                    borderRadius: "2px",
                    background: isCurrent
                      ? "var(--terracotta, #B85C38)"
                      : isCompleted
                      ? "var(--charcoal, #1C1C1A)"
                      : "var(--linen, #E8E2D8)",
                    marginBottom: "0.5rem",
                    transition: "background 200ms",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: isCurrent
                      ? "var(--terracotta, #B85C38)"
                      : isCompleted
                      ? "var(--charcoal, #1C1C1A)"
                      : "var(--stone, #7A7570)",
                  }}
                >
                  Step {s.id}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    fontWeight: isCurrent ? 600 : 500,
                    color: isCurrent ? "var(--charcoal, #1C1C1A)" : "var(--graphite, #4A4740)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: "0.875rem 1rem",
              background: "#FDF8F4",
              border: "1px solid rgba(184,92,56,0.3)",
              borderRadius: "8px",
              color: "var(--terracotta, #B85C38)",
              fontSize: "0.875rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            role="alert"
          >
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: PHOTOGRAPHY ── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--charcoal, #1C1C1A)",
                  margin: "0 0 0.35rem",
                }}
              >
                1. Object Photography
              </h2>
              <p style={{ margin: 0, color: "var(--stone, #7A7570)", fontSize: "0.875rem" }}>
                Authentic high-resolution photographs reveal the master needlework, chisel marks, and
                glaze character.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
              id="photo-upload-input"
            />

            {photoPreview ? (
              <div
                style={{
                  border: "1.5px solid var(--fog, #D4CEC5)",
                  borderRadius: "10px",
                  padding: "1.5rem",
                  background: "var(--warm-white, #FDFBF7)",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    maxHeight: "340px",
                    overflow: "hidden",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#000",
                  }}
                >
                  <img
                    src={photoPreview}
                    alt="Listing preview"
                    style={{ maxHeight: "340px", width: "auto", objectFit: "contain" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginTop: "1.25rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "0.6rem 1.1rem",
                      borderRadius: "6px",
                      border: "1.5px solid var(--fog, #D4CEC5)",
                      background: "#fff",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "var(--charcoal, #1C1C1A)",
                    }}
                  >
                    Replace photograph
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview("");
                      setPhotoFile(null);
                    }}
                    style={{
                      padding: "0.6rem 1rem",
                      background: "none",
                      border: "none",
                      color: "var(--terracotta, #B85C38)",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                aria-label="Upload photograph"
                style={{
                  border: "2px dashed var(--fog, #D4CEC5)",
                  borderRadius: "10px",
                  padding: "3.5rem 1.5rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "var(--warm-white, #FDFBF7)",
                  marginBottom: "2rem",
                  transition: "border-color 180ms, background 180ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--terracotta, #B85C38)";
                  (e.currentTarget as HTMLDivElement).style.background = "#FDF8F4";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--fog, #D4CEC5)";
                  (e.currentTarget as HTMLDivElement).style.background =
                    "var(--warm-white, #FDFBF7)";
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--linen, #E8E2D8)",
                    color: "var(--charcoal, #1C1C1A)",
                    marginBottom: "1rem",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                  }}
                >
                  +
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--charcoal, #1C1C1A)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Upload high-resolution craft photograph
                </div>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--stone, #7A7570)",
                    maxWidth: "360px",
                    margin: "0 auto",
                    lineHeight: 1.5,
                  }}
                >
                  Select a photo from your device. Natural diffused lighting highlights authentic
                  texture best.
                </div>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--linen, #E8E2D8)",
              }}
            >
              <button
                type="button"
                onClick={goNext}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--stone, #7A7570)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Skip photo for now
              </button>
              <button
                type="button"
                onClick={goNext}
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: "6px",
                  background: "var(--charcoal, #1C1C1A)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui, system-ui, sans-serif)",
                }}
              >
                Continue to Classification &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: CRAFT CATEGORY ── */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--charcoal, #1C1C1A)",
                  margin: "0 0 0.35rem",
                }}
              >
                2. Craft Classification
              </h2>
              <p style={{ margin: 0, color: "var(--stone, #7A7570)", fontSize: "0.875rem" }}>
                Select the cultural discipline that best encompasses your creation.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "0.85rem",
                marginBottom: "2.5rem",
              }}
              role="radiogroup"
              aria-label="Select craft tradition"
            >
              {CRAFT_OPTIONS.map((opt) => {
                const selected = craftType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCraftType(opt.key)}
                    style={{
                      padding: "1.25rem 1.15rem",
                      borderRadius: "8px",
                      border: `1.5px solid ${selected ? "var(--terracotta, #B85C38)" : "var(--fog, #D4CEC5)"}`,
                      background: selected ? "#FDF8F4" : "var(--warm-white, #FDFBF7)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border-color 160ms, background 160ms",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--charcoal, #1C1C1A)",
                        }}
                      >
                        {opt.label}
                      </span>
                      {selected && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--terracotta, #B85C38)",
                          }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--stone, #7A7570)",
                        lineHeight: 1.45,
                      }}
                    >
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--linen, #E8E2D8)",
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--stone, #7A7570)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: "6px",
                  background: canAdvance() ? "var(--charcoal, #1C1C1A)" : "var(--fog, #D4CEC5)",
                  color: canAdvance() ? "#fff" : "var(--stone, #7A7570)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-ui, system-ui, sans-serif)",
                }}
              >
                Continue to Details &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: DETAILS & STORY ── */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--charcoal, #1C1C1A)",
                  margin: "0 0 0.35rem",
                }}
              >
                3. Object Details & Provenance
              </h2>
              <p style={{ margin: 0, color: "var(--stone, #7A7570)", fontSize: "0.875rem" }}>
                Name your creation and document the artisan narrative behind its making.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
              {/* Product Title */}
              <div>
                <label style={labelStyle} htmlFor="craft-title">
                  Object Title *
                </label>
                <input
                  id="craft-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hand-spun Kasuti Saree with Chariot Motifs"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Raw Materials */}
              <div>
                <label style={labelStyle} htmlFor="craft-materials">
                  Primary Raw Materials
                </label>
                <input
                  id="craft-materials"
                  type="text"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="e.g. Mulberry Silk, Natural Indigo Dye, Zari Thread"
                  style={inputStyle}
                />
              </div>

              {/* Story / Description with Voice Recording */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.4rem",
                  }}
                >
                  <label style={{ ...labelStyle, margin: 0 }} htmlFor="craft-description">
                    Artisan Story & Crafting Process
                  </label>
                  {SpeechRecognition && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.65rem",
                        borderRadius: "999px",
                        border: `1px solid ${isRecording ? "var(--terracotta, #B85C38)" : "var(--fog, #D4CEC5)"}`,
                        background: isRecording ? "#FDF8F4" : "transparent",
                        color: isRecording ? "var(--terracotta, #B85C38)" : "var(--graphite, #4A4740)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: isRecording ? "var(--terracotta, #B85C38)" : "#9C9490",
                        }}
                      />
                      <span>{isRecording ? "Listening… tap to stop" : "Speak your story"}</span>
                    </button>
                  )}
                </div>
                <textarea
                  id="craft-description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe how this piece was crafted, the lineage of the motif, cultural significance, or special technique used…"
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--linen, #E8E2D8)",
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--stone, #7A7570)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: "6px",
                  background: canAdvance() ? "var(--charcoal, #1C1C1A)" : "var(--fog, #D4CEC5)",
                  color: canAdvance() ? "#fff" : "var(--stone, #7A7570)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-ui, system-ui, sans-serif)",
                }}
              >
                Continue to Craftsmanship &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: TIME & CRAFTSMANSHIP ── */}
        {step === 4 && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--charcoal, #1C1C1A)",
                  margin: "0 0 0.35rem",
                }}
              >
                4. Craftsmanship & Time Invested
              </h2>
              <p style={{ margin: 0, color: "var(--stone, #7A7570)", fontSize: "0.875rem" }}>
                True luxury is defined by dedicated human hours. We use this to calculate an honest
                artisan wage.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              {/* Hours Spent */}
              <div
                style={{
                  padding: "1.5rem",
                  border: "1.5px solid var(--fog, #D4CEC5)",
                  borderRadius: "8px",
                  background: "var(--warm-white, #FDFBF7)",
                }}
              >
                <label style={labelStyle}>Time to make (hours) *</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setHours(Math.max(1, hours - 1))}
                    disabled={hours <= 1}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--fog, #D4CEC5)",
                      background: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      cursor: hours <= 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    -
                  </button>
                  <div style={{ textAlign: "center", minWidth: "60px" }}>
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        color: "var(--charcoal, #1C1C1A)",
                      }}
                    >
                      {hours}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--stone, #7A7570)" }}>hours</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHours(hours + 1)}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--fog, #D4CEC5)",
                      background: "#fff",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Material Expense */}
              <div
                style={{
                  padding: "1.5rem",
                  border: "1.5px solid var(--fog, #D4CEC5)",
                  borderRadius: "8px",
                  background: "var(--warm-white, #FDFBF7)",
                }}
              >
                <label style={labelStyle} htmlFor="material-cost-input">
                  Direct Material Costs (&lrm;&#8377;)
                </label>
                <div style={{ marginTop: "0.75rem" }}>
                  <input
                    id="material-cost-input"
                    type="number"
                    min={0}
                    step={50}
                    value={materialCost}
                    onChange={(e) => setMaterialCost(Number(e.target.value))}
                    style={{ ...inputStyle, fontSize: "1.1rem", fontWeight: 600 }}
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--stone, #7A7570)",
                      marginTop: "0.4rem",
                    }}
                  >
                    Total expenditure on base fabric, clay, natural dyes, or metals.
                  </div>
                </div>
              </div>
            </div>

            {/* Technique Complexity */}
            <div style={{ marginBottom: "2.5rem" }}>
              <label style={labelStyle}>Technique Difficulty & Heritage Rarity</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                {(
                  [
                    ["low", "Foundational", "Standard handcraft practice"],
                    ["medium", "Intermediate", "Multi-step seasoned skill"],
                    ["high", "Advanced", "Intricate master-level patience"],
                    ["very_high", "Masterwork", "Heritage lineage technique"],
                  ] as const
                ).map(([key, titleText, descText]) => {
                  const selected = complexity === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setComplexity(key as Complexity)}
                      style={{
                        padding: "1rem",
                        borderRadius: "8px",
                        border: `1.5px solid ${selected ? "var(--terracotta, #B85C38)" : "var(--fog, #D4CEC5)"}`,
                        background: selected ? "#FDF8F4" : "var(--warm-white, #FDFBF7)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "border-color 150ms",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--charcoal, #1C1C1A)",
                          marginBottom: "0.2rem",
                        }}
                      >
                        {titleText}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--stone, #7A7570)" }}>
                        {descText}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--linen, #E8E2D8)",
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--stone, #7A7570)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                style={{
                  padding: "0.75rem 1.75rem",
                  borderRadius: "6px",
                  background: canAdvance() ? "var(--charcoal, #1C1C1A)" : "var(--fog, #D4CEC5)",
                  color: canAdvance() ? "#fff" : "var(--stone, #7A7570)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  border: "none",
                  cursor: canAdvance() ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-ui, system-ui, sans-serif)",
                }}
              >
                Continue to Fair Pricing &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: FAIR PRICING & PUBLISH ── */}
        {step === 5 && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "var(--charcoal, #1C1C1A)",
                  margin: "0 0 0.35rem",
                }}
              >
                5. Fair Pricing & Publication
              </h2>
              <p style={{ margin: 0, color: "var(--stone, #7A7570)", fontSize: "0.875rem" }}>
                Our algorithm protects master craft from exploitative pricing by calculating direct
                material costs and living hourly wages.
              </p>
            </div>

            {/* Fair Price Breakdown Card */}
            {priceResult ? (
              <div
                style={{
                  border: "1.5px solid var(--linen, #E8E2D8)",
                  borderRadius: "10px",
                  background: "#fff",
                  padding: "1.75rem",
                  marginBottom: "2rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    borderBottom: "1px solid var(--linen, #E8E2D8)",
                    paddingBottom: "1.25rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--sage, #5A7A60)",
                        fontWeight: 700,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Algorithmic Fair Price Suggestion
                    </div>
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-display, Georgia, serif)",
                        color: "var(--charcoal, #1C1C1A)",
                      }}
                    >
                      &#8377;{priceResult.suggested_price.toLocaleString("en-IN")}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--stone, #7A7570)",
                        marginTop: "0.2rem",
                      }}
                    >
                      Suggested equitable range: &#8377;
                      {priceResult.suggested_range.min.toLocaleString("en-IN")} &ndash; &#8377;
                      {priceResult.suggested_range.max.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFinalPrice(priceResult.suggested_price)}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: "6px",
                      border: "1.5px solid var(--charcoal, #1C1C1A)",
                      background:
                        finalPrice === priceResult.suggested_price
                          ? "var(--charcoal, #1C1C1A)"
                          : "transparent",
                      color:
                        finalPrice === priceResult.suggested_price
                          ? "#fff"
                          : "var(--charcoal, #1C1C1A)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 150ms",
                    }}
                  >
                    {finalPrice === priceResult.suggested_price
                      ? "Suggested price applied"
                      : "Apply suggested price"}
                  </button>
                </div>

                {/* Breakdown items */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--stone, #7A7570)", marginBottom: "0.2rem" }}>
                      Materials
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--charcoal, #1C1C1A)" }}>
                      &#8377;{priceResult.materials_cost.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--stone, #7A7570)", marginBottom: "0.2rem" }}>
                      Artisan Labor ({priceResult.hours}h &times; &#8377;
                      {priceResult.fair_hourly_wage}/h)
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--charcoal, #1C1C1A)" }}>
                      &#8377;{priceResult.labour_cost.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--stone, #7A7570)", marginBottom: "0.2rem" }}>
                      Lineage Premium
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--charcoal, #1C1C1A)" }}>
                      &#8377;{priceResult.craft_premium_amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "2rem" }}>
                <button
                  type="button"
                  onClick={handleGetPriceEstimate}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: "6px",
                    border: "1.5px solid var(--fog, #D4CEC5)",
                    background: "#fff",
                    color: "var(--charcoal, #1C1C1A)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Calculating suggestion…" : "Recalculate fair price suggestion"}
                </button>
              </div>
            )}

            {/* Final Listing Inputs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.5rem",
                marginBottom: "2.5rem",
              }}
            >
              <div>
                <label style={labelStyle} htmlFor="final-selling-price">
                  Your Selling Price (&lrm;&#8377;) *
                </label>
                <input
                  id="final-selling-price"
                  type="number"
                  min={1}
                  step={50}
                  value={finalPrice || ""}
                  onChange={(e) => setFinalPrice(Number(e.target.value))}
                  placeholder="e.g. 4200"
                  style={{ ...inputStyle, fontSize: "1.2rem", fontWeight: 600 }}
                  required
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--stone, #7A7570)",
                    marginTop: "0.35rem",
                  }}
                >
                  The transparent acquisition price patrons pay directly.
                </div>
              </div>

              <div>
                <label style={labelStyle} htmlFor="listing-stock-qty">
                  Available Quantity
                </label>
                <input
                  id="listing-stock-qty"
                  type="number"
                  min={1}
                  value={stock}
                  onChange={(e) => setStock(Math.max(1, Number(e.target.value)))}
                  style={{ ...inputStyle, fontSize: "1.2rem", fontWeight: 600 }}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--stone, #7A7570)",
                    marginTop: "0.35rem",
                  }}
                >
                  Quantity currently crafted and ready to dispatch.
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--linen, #E8E2D8)",
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--stone, #7A7570)",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                &larr; Back
              </button>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: "6px",
                    border: "1.5px solid var(--fog, #D4CEC5)",
                    background: "transparent",
                    color: "var(--graphite, #4A4740)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !canAdvance()}
                  style={{
                    padding: "0.75rem 2rem",
                    borderRadius: "6px",
                    background: canAdvance() ? "var(--charcoal, #1C1C1A)" : "var(--fog, #D4CEC5)",
                    color: canAdvance() ? "#fff" : "var(--stone, #7A7570)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: canAdvance() && !loading ? "pointer" : "not-allowed",
                    fontFamily: "var(--font-ui, system-ui, sans-serif)",
                    transition: "background 150ms",
                  }}
                >
                  {loading ? "Publishing…" : "Publish Craft Listing"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
