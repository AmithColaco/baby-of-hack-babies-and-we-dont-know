import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProducts, listingToCraftObject } from "../data/productStore";
import { useAuth } from "../contexts/AuthContext";
import { handleImageError, getFallbackForCraft } from "../utils/imageFallback";
import { getListings, archiveListing, type ListingRecord } from "../api/listings";
import { getArtisanOrders, updateOrderStatus, type OrderRecord } from "../api/orders";
import { ProvenanceTagModal } from "../components/ProvenanceTagModal";
import type { CraftObject } from "../types";

const UNDO_MS = 6000;

// ─── Status label helper ─────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  PLACED: "#B85C38",
  CONFIRMED: "#5A7A60",
  SHIPPED: "#4A6B9A",
  DELIVERED: "#4A4740",
  CANCELLED: "#9C9490",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.65rem",
        borderRadius: "999px",
        fontSize: "0.6875rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: STATUS_COLORS[status] || "#4A4740",
        background: `${STATUS_COLORS[status] || "#4A4740"}18`,
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        border: `1px solid ${STATUS_COLORS[status] || "#4A4740"}33`,
      }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Shared button ───────────────────────────────────────────────
interface ActionButtonProps {
  onClick?: () => void;
  to?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  id?: string;
  children: React.ReactNode;
}
function ActionButton({ onClick, to, variant = "secondary", small, disabled, type = "button", id, children }: ActionButtonProps) {
  const styles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: small ? "0.4rem 0.875rem" : "0.65rem 1.25rem",
    fontSize: small ? "0.8125rem" : "0.9rem",
    fontWeight: 600,
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background 180ms, color 180ms, border-color 180ms",
    textDecoration: "none",
    border: "1.5px solid transparent",
    letterSpacing: "0.01em",
    ...(variant === "primary" && {
      background: "var(--charcoal, #1C1C1A)",
      color: "#fff",
      borderColor: "var(--charcoal, #1C1C1A)",
    }),
    ...(variant === "secondary" && {
      background: "transparent",
      color: "var(--graphite, #4A4740)",
      borderColor: "var(--fog, #D4CEC5)",
    }),
    ...(variant === "danger" && {
      background: "transparent",
      color: "var(--terracotta, #B85C38)",
      borderColor: "rgba(184,92,56,0.3)",
    }),
    ...(variant === "ghost" && {
      background: "transparent",
      color: "var(--stone, #7A7570)",
      borderColor: "transparent",
    }),
  };

  if (to) {
    return <Link to={to} id={id} style={styles}>{children}</Link>;
  }
  return (
    <button type={type} id={id} onClick={onClick} disabled={disabled} style={styles}>
      {children}
    </button>
  );
}

// ─── Divider ─────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: "1px", background: "var(--linen, #E8E2D8)", margin: "1.5rem 0" }} />;
}

// ─── Section heading ──────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        fontSize: "0.6875rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--stone, #7A7570)",
        margin: "0 0 1rem 0",
      }}
    >
      {children}
    </h2>
  );
}

// ─── Sidebar nav item ─────────────────────────────────────────────
interface NavItemProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}
function NavItem({ label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0.6rem 0.875rem",
        border: "none",
        borderRadius: "6px",
        background: active ? "var(--parchment, #EDE6D6)" : "transparent",
        color: active ? "var(--charcoal, #1C1C1A)" : "var(--graphite, #4A4740)",
        fontSize: "0.9rem",
        fontWeight: active ? 600 : 400,
        fontFamily: "var(--font-ui, system-ui, sans-serif)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 160ms, color 160ms",
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--ivory, #F8F4EE)";
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            background: "var(--terracotta, #B85C38)",
            color: "#fff",
            fontSize: "0.6875rem",
            fontWeight: 700,
            borderRadius: "999px",
            padding: "0.1rem 0.45rem",
            minWidth: "18px",
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const { products, deleteProduct } = useProducts();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  type View = "overview" | "orders" | "listings" | "profile";
  const [view, setView] = useState<View>("overview");
  const [tagModalCraft, setTagModalCraft] = useState<CraftObject | null>(null);

  // Orders
  const [artisanOrders, setArtisanOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState<{
    id: string;
    next: "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  } | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [undoQueue, setUndoQueue] = useState<{ id: string; prev: string; label: string }[]>([]);

  // Listings
  const [artisanListings, setArtisanListings] = useState<ListingRecord[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Profile form
  const [name, setName] = useState(user?.name || "");
  const [region, setRegion] = useState(user?.region || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { updateProfileOnBackend } = useAuth();

  const fetchData = async () => {
    if (!user) return;
    setOrdersLoading(true);
    setLoadingListings(true);
    try { setArtisanOrders(await getArtisanOrders()); } catch { /* offline */ }
    finally { setOrdersLoading(false); }
    try { setArtisanListings(await getListings({ artisan_id: user.id })); } catch { /* offline */ }
    finally { setLoadingListings(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  // auto-draft profile
  useEffect(() => {
    try { localStorage.setItem("artisan_profile_draft", JSON.stringify({ name, region, bio })); } catch { /* quota */ }
  }, [name, region, bio]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    try {
      await updateProfileOnBackend({ name, village: region, bio, role: "artisan" });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    }
  };

  const handleStatusTransition = async (
    orderId: string,
    next: "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  ) => {
    setOrderActionLoading(orderId);
    setConfirmingOrder(null);
    const prevOrder = artisanOrders.find(o => o.id === orderId);
    try {
      const updated = await updateOrderStatus(orderId, next);
      setArtisanOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      if (prevOrder && next !== "CANCELLED") {
        setUndoQueue(q => [...q, { id: orderId, prev: prevOrder.status, label: prevOrder.id.slice(0, 8).toUpperCase() }]);
        setTimeout(() => setUndoQueue(q => q.filter(u => u.id !== orderId)), UNDO_MS);
      }
    } catch {
      setSaveError("Could not update order. Check your connection.");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleUndo = async (item: { id: string; prev: string }) => {
    setUndoQueue(q => q.filter(u => u.id !== item.id));
    await handleStatusTransition(item.id, item.prev as "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED");
  };

  const handleDelete = async (id: string) => {
    try { await archiveListing(id); } catch { /* offline */ }
    deleteProduct(id);
    setArtisanListings(prev => prev.filter(x => x.id !== id));
    setDeleteConfirmId(null);
  };

  const displayPieces = artisanListings.length > 0
    ? artisanListings.map(listingToCraftObject)
    : products;

  const pendingOrders = artisanOrders.filter(o => o.status === "PLACED" || o.status === "CONFIRMED");
  const totalListings = displayPieces.length;

  // ── Shell styles ──────────────────────────────────────────────
  const shell: React.CSSProperties = {
    display: "flex",
    flex: 1,
    background: "var(--warm-white, #FDFBF7)",
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
    minHeight: "calc(100vh - 72px)",
  };

  const sidebar: React.CSSProperties = {
    width: "220px",
    flexShrink: 0,
    borderRight: "1px solid var(--linen, #E8E2D8)",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    position: "sticky" as const,
    top: 0,
    height: "100vh",
    overflowY: "auto",
    background: "var(--warm-white, #FDFBF7)",
  };

  const main: React.CSSProperties = {
    flex: 1,
    padding: "2.5rem 2rem",
    maxWidth: "840px",
    overflowY: "auto" as const,
  };

  // ── Input style helper ───────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 0.9rem",
    border: "1.5px solid var(--fog, #D4CEC5)",
    borderRadius: "6px",
    fontSize: "0.9375rem",
    color: "var(--charcoal, #1C1C1A)",
    background: "var(--warm-white, #FDFBF7)",
    fontFamily: "var(--font-ui, system-ui, sans-serif)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 180ms",
  };

  return (
    <div style={shell} role="main" aria-label="Artisan dashboard">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside style={sidebar} aria-label="Dashboard navigation">
        {/* Brand */}
        <div style={{ marginBottom: "1.75rem", paddingLeft: "0.5rem" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--charcoal, #1C1C1A)" }}>
              KAARIGAR
            </div>
          </Link>
          <div style={{ fontSize: "0.6875rem", color: "var(--stone, #7A7570)", marginTop: "0.2rem", fontWeight: 400 }}>
            Artisan Studio
          </div>
        </div>

        <SectionHeading>Dashboard</SectionHeading>

        <NavItem label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
        <NavItem label="Orders" active={view === "orders"} onClick={() => setView("orders")} badge={pendingOrders.length} />
        <NavItem label="Listings" active={view === "listings"} onClick={() => setView("listings")} />
        <NavItem label="Profile" active={view === "profile"} onClick={() => setView("profile")} />

        <Divider />

        <NavItem label="Add listing" active={false} onClick={() => navigate("/dashboard/create")} />
        <NavItem label="Custom orders" active={false} onClick={() => navigate("/commissions")} />
        <NavItem label="View storefront" active={false} onClick={() => navigate("/gallery")} />

        {/* Sign out at bottom */}
        <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => { logout(); navigate("/"); }}
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--terracotta, #B85C38)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--stone, #7A7570)"; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <div style={main}>

        {/* Global error/undo banner */}
        {saveError && (
          <div
            role="alert"
            style={{
              background: "rgba(184,92,56,0.08)",
              border: "1px solid rgba(184,92,56,0.25)",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              color: "var(--terracotta, #B85C38)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-ui, system-ui, sans-serif)",
            }}
          >
            {saveError}
            <button type="button" onClick={() => setSaveError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "1rem", lineHeight: 1 }}>×</button>
          </div>
        )}

        {undoQueue.map(u => (
          <div
            key={u.id}
            style={{
              background: "rgba(90,122,96,0.08)",
              border: "1px solid rgba(90,122,96,0.25)",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "var(--forest, #3D5C42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--font-ui, system-ui, sans-serif)",
            }}
          >
            Status updated for order {u.label}.
            <button
              type="button"
              onClick={() => handleUndo(u)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--terracotta, #B85C38)", fontWeight: 600, fontSize: "0.875rem", padding: "0", textDecoration: "underline", fontFamily: "var(--font-ui, system-ui, sans-serif)" }}
            >
              Undo
            </button>
          </div>
        ))}

        {/* ── VIEW: OVERVIEW ── */}
        {view === "overview" && (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.75rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", margin: "0 0 0.3rem 0" }}>
                {user?.name?.split(" ")[0] ? `Hello, ${user.name.split(" ")[0]}.` : "Welcome back."}
              </h1>
              {user?.craftSpecialization && (
                <p style={{ color: "var(--stone, #7A7570)", fontSize: "0.9375rem", margin: 0 }}>
                  {user.craftSpecialization}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Active listings", value: totalListings },
                { label: "Pending orders", value: pendingOrders.length },
                { label: "Total orders", value: artisanOrders.length },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    padding: "1.25rem 1rem",
                    border: "1px solid var(--linen, #E8E2D8)",
                    borderRadius: "8px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "var(--font-display, Georgia, serif)", color: "var(--charcoal, #1C1C1A)", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--stone, #7A7570)", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            {/* Quick actions */}
            <SectionHeading>Quick actions</SectionHeading>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <ActionButton to="/dashboard/create" variant="primary">Add listing</ActionButton>
              <ActionButton onClick={() => setView("orders")} variant="secondary">Manage orders</ActionButton>
              <ActionButton onClick={() => navigate("/commissions")} variant="secondary">Custom orders</ActionButton>
            </div>

            {/* Recent orders preview */}
            {artisanOrders.length > 0 && (
              <>
                <Divider />
                <SectionHeading>Recent orders</SectionHeading>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {artisanOrders.slice(0, 3).map(ord => (
                    <div
                      key={ord.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.875rem 1rem",
                        border: "1px solid var(--linen, #E8E2D8)",
                        borderRadius: "8px",
                        background: "#fff",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", marginBottom: "0.25rem" }}>
                          {ord.items?.[0]?.listing_title || "Order"}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--stone, #7A7570)" }}>
                          #{ord.id.slice(0, 8).toUpperCase()} · ₹{ord.total_inr.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <StatusPill status={ord.status} />
                    </div>
                  ))}
                  {artisanOrders.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setView("orders")}
                      style={{ background: "none", border: "none", color: "var(--terracotta, #B85C38)", fontSize: "0.875rem", cursor: "pointer", textAlign: "left", padding: "0", fontFamily: "var(--font-ui, system-ui, sans-serif)", textDecoration: "underline" }}
                    >
                      View all {artisanOrders.length} orders
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── VIEW: ORDERS ── */}
        {view === "orders" && (
          <div>
            <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.75rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", margin: "0 0 2rem 0" }}>
              Orders
            </h1>

            {ordersLoading ? (
              <p style={{ color: "var(--stone, #7A7570)", fontSize: "0.9rem" }}>Loading orders…</p>
            ) : artisanOrders.length === 0 ? (
              <div style={{ padding: "3rem 0", textAlign: "center" }}>
                <p style={{ color: "var(--stone, #7A7570)", fontSize: "0.9375rem" }}>No orders yet.</p>
                <p style={{ color: "var(--mist, #B0AAA0)", fontSize: "0.8125rem", marginTop: "0.4rem" }}>
                  When a buyer places an order, it will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {artisanOrders.map(ord => {
                  const isBusy = orderActionLoading === ord.id;
                  const buyerName = (ord as any).buyer_name || "Buyer";

                  return (
                    <article
                      key={ord.id}
                      style={{
                        border: "1px solid var(--linen, #E8E2D8)",
                        borderRadius: "10px",
                        padding: "1.25rem",
                        background: "#fff",
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem", gap: "1rem" }}>
                        <div>
                          <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", marginBottom: "0.2rem" }}>
                            {ord.items?.[0]?.listing_title || "Handcraft piece"}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "var(--stone, #7A7570)" }}>
                            #{ord.id.slice(0, 8).toUpperCase()} · {buyerName.split(" ")[0]} · ₹{ord.total_inr.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <StatusPill status={ord.status} />
                      </div>

                      {/* Confirm overlay */}
                      {confirmingOrder?.id === ord.id ? (
                        <div
                          role="alertdialog"
                          aria-modal="true"
                          style={{
                            background: "var(--ivory, #F8F4EE)",
                            border: "1px solid var(--fog, #D4CEC5)",
                            borderRadius: "6px",
                            padding: "1rem",
                          }}
                        >
                          <p style={{ fontSize: "0.9rem", color: "var(--graphite, #4A4740)", marginBottom: "0.75rem", fontFamily: "var(--font-ui, system-ui, sans-serif)" }}>
                            {confirmingOrder.next === "CANCELLED"
                              ? "Cancel this order?"
                              : `Mark as ${STATUS_LABELS[confirmingOrder.next] || confirmingOrder.next}?`}
                          </p>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <ActionButton
                              variant="primary"
                              small
                              disabled={isBusy}
                              onClick={() => handleStatusTransition(ord.id, confirmingOrder.next)}
                            >
                              {isBusy ? "…" : "Confirm"}
                            </ActionButton>
                            <ActionButton variant="secondary" small onClick={() => setConfirmingOrder(null)}>
                              Cancel
                            </ActionButton>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                          {ord.status === "PLACED" && (
                            <ActionButton
                              variant="primary"
                              small
                              id={`mark-packed-${ord.id}`}
                              onClick={() => setConfirmingOrder({ id: ord.id, next: "CONFIRMED" })}
                            >
                              Mark as packed
                            </ActionButton>
                          )}
                          {ord.status === "CONFIRMED" && (
                            <ActionButton
                              variant="primary"
                              small
                              id={`mark-shipped-${ord.id}`}
                              onClick={() => setConfirmingOrder({ id: ord.id, next: "SHIPPED" })}
                            >
                              Mark as shipped
                            </ActionButton>
                          )}
                          {ord.status === "SHIPPED" && (
                            <ActionButton
                              variant="secondary"
                              small
                              onClick={() => setConfirmingOrder({ id: ord.id, next: "DELIVERED" })}
                            >
                              Mark as delivered
                            </ActionButton>
                          )}
                          {ord.status === "DELIVERED" && (
                            <span style={{ fontSize: "0.8125rem", color: "var(--sage, #5A7A60)", fontFamily: "var(--font-ui, system-ui, sans-serif)" }}>
                              Order complete.
                            </span>
                          )}
                          {ord.status !== "DELIVERED" && ord.status !== "CANCELLED" && (
                            <ActionButton
                              variant="ghost"
                              small
                              onClick={() => setConfirmingOrder({ id: ord.id, next: "CANCELLED" })}
                            >
                              Cancel order
                            </ActionButton>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: LISTINGS ── */}
        {view === "listings" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
              <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.75rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", margin: 0 }}>
                Listings
              </h1>
              <ActionButton to="/dashboard/create" variant="primary">Add listing</ActionButton>
            </div>

            {loadingListings ? (
              <p style={{ color: "var(--stone, #7A7570)", fontSize: "0.9rem" }}>Loading listings…</p>
            ) : displayPieces.length === 0 ? (
              <div style={{ padding: "3rem 0", textAlign: "center" }}>
                <p style={{ color: "var(--stone, #7A7570)", fontSize: "0.9375rem" }}>No listings yet.</p>
                <p style={{ color: "var(--mist, #B0AAA0)", fontSize: "0.8125rem", marginTop: "0.4rem", marginBottom: "1.5rem" }}>
                  Add your first product and it will appear in the gallery.
                </p>
                <ActionButton to="/dashboard/create" variant="primary">Add your first listing</ActionButton>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {displayPieces.map(item => (
                  <article
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.875rem 1rem",
                      border: "1px solid var(--linen, #E8E2D8)",
                      borderRadius: "8px",
                      background: "#fff",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      onError={e => handleImageError(e, getFallbackForCraft(item.craftTradition || item.category))}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                        borderRadius: "6px",
                        flexShrink: 0,
                        background: "var(--ivory, #F8F4EE)",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--stone, #7A7570)", marginTop: "0.15rem" }}>
                        ₹{item.price.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                      <ActionButton to={`/dashboard/edit/${item.id}`} variant="secondary" small>Edit</ActionButton>
                      <ActionButton variant="ghost" small onClick={() => setTagModalCraft(item)}>
                        Print tag
                      </ActionButton>
                      {deleteConfirmId === item.id ? (
                        <>
                          <ActionButton variant="danger" small onClick={() => handleDelete(item.id)}>Remove</ActionButton>
                          <ActionButton variant="secondary" small onClick={() => setDeleteConfirmId(null)}>Keep</ActionButton>
                        </>
                      ) : (
                        <ActionButton
                          variant="ghost"
                          small
                          onClick={() => setDeleteConfirmId(item.id)}
                        >
                          Delete
                        </ActionButton>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: PROFILE ── */}
        {view === "profile" && (
          <div>
            <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.75rem", fontWeight: 600, color: "var(--charcoal, #1C1C1A)", margin: "0 0 2rem 0" }}>
              Profile
            </h1>

            <form onSubmit={handleProfileSave} style={{ maxWidth: "480px" }}>
              {[
                { id: "p-name", label: "Display name", value: name, onChange: (v: string) => setName(v), placeholder: "e.g. Parvatamma Badiger" },
                { id: "p-region", label: "Village or district", value: region, onChange: (v: string) => setRegion(v), placeholder: "e.g. Dharwad, Karnataka" },
              ].map(field => (
                <div key={field.id} style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor={field.id}
                    style={{
                      display: "block",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--stone, #7A7570)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type="text"
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--terracotta, #B85C38)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--fog, #D4CEC5)"; }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="p-bio"
                  style={{
                    display: "block",
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--stone, #7A7570)",
                    marginBottom: "0.4rem",
                  }}
                >
                  About your craft
                </label>
                <textarea
                  id="p-bio"
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell buyers about yourself, your craft tradition, and what makes your work unique."
                  style={{ ...inputStyle, resize: "vertical" as const }}
                  onFocus={e => { e.currentTarget.style.borderColor = "var(--terracotta, #B85C38)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "var(--fog, #D4CEC5)"; }}
                />
              </div>

              {saveError && (
                <p role="alert" style={{ fontSize: "0.875rem", color: "var(--terracotta, #B85C38)", marginBottom: "1rem" }}>
                  {saveError}
                </p>
              )}
              {savedNotice && (
                <p style={{ fontSize: "0.875rem", color: "var(--sage, #5A7A60)", marginBottom: "1rem" }}>
                  Profile saved.
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <ActionButton type="submit" variant="primary">Save profile</ActionButton>
                <ActionButton
                  variant="ghost"
                  onClick={() => { logout(); navigate("/"); }}
                >
                  Sign out
                </ActionButton>
              </div>
            </form>

            {/* Account info */}
            <Divider />
            <SectionHeading>Account</SectionHeading>
            <div style={{ fontSize: "0.875rem", color: "var(--graphite, #4A4740)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {user?.email && (
                <div><span style={{ color: "var(--stone, #7A7570)" }}>Email: </span>{user.email}</div>
              )}
              {user?.phone && (
                <div><span style={{ color: "var(--stone, #7A7570)" }}>Phone: </span>{user.phone}</div>
              )}
              <div><span style={{ color: "var(--stone, #7A7570)" }}>Role: </span>{user?.backendRole}</div>
            </div>
          </div>
        )}
      </div>

      {/* Provenance tag modal */}
      {tagModalCraft && (
        <ProvenanceTagModal
          craft={tagModalCraft}
          isOpen={Boolean(tagModalCraft)}
          onClose={() => setTagModalCraft(null)}
        />
      )}
    </div>
  );
}
