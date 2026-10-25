import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProducts, listingToCraftObject } from "../data/productStore";
import { useAuth } from "../contexts/AuthContext";
import { handleImageError, getFallbackForCraft } from "../utils/imageFallback";
import { getListings, archiveListing, type ListingRecord } from "../api/listings";
import { getArtisanOrders, updateOrderStatus, type OrderRecord } from "../api/orders";
import { ProvenanceTagModal } from "../components/ProvenanceTagModal";
import {
  BottomNav, HelpButton, StatusBadge, PageHeader, OfflineBanner, BigButton, LangSplash
} from "../components/artisan";
import type { CraftObject } from "../types";
import "../artisan.css";

const UNDO_MS = 6000;

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { products, deleteProduct } = useProducts();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // View: home | orders | pieces | profile
  const [view, setView] = useState<"home" | "orders" | "pieces" | "profile">("home");
  const [tagModalCraft, setTagModalCraft] = useState<CraftObject | null>(null);
  const [showLangSplash, setShowLangSplash] = useState(() => !localStorage.getItem("kaarigar_lang"));

  // Orders
  const [artisanOrders, setArtisanOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState<{ id: string; next: "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" } | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [undoQueue, setUndoQueue] = useState<{ id: string; prev: string; label: string }[]>([]);

  // Listings
  const [artisanListings, setArtisanListings] = useState<ListingRecord[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Profile
  const [name, setName] = useState(user?.name || "");
  const [region, setRegion] = useState(user?.region || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { updateProfileOnBackend } = useAuth();

  const fetchDashboardData = async () => {
    if (!user) return;
    setOrdersLoading(true);
    setLoadingListings(true);
    try { setArtisanOrders(await getArtisanOrders()); } catch { /* offline ok */ }
    finally { setOrdersLoading(false); }
    try { setArtisanListings(await getListings({ artisan_id: user.id })); } catch { /* offline ok */ }
    finally { setLoadingListings(false); }
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  // auto-save form drafts
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
      setSaveError(t("artisan.profile_save_error", "Something went wrong. Please try again in a moment."));
    }
  };

  const handleStatusTransition = async (orderId: string, next: "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED") => {
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
      setSaveError(t("artisan.order_update_error", "Could not update the order. Please check your connection and try again."));
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleUndo = async (item: { id: string; prev: string }) => {
    setUndoQueue(q => q.filter(u => u.id !== item.id));
    await handleStatusTransition(item.id, item.prev as any);
  };

  const handleDelete = async (id: string) => {
    try { await archiveListing(id); } catch { /* offline ok */ }
    deleteProduct(id);
    setArtisanListings(prev => prev.filter(x => x.id !== id));
    setDeleteConfirmId(null);
  };

  const displayPieces = artisanListings.length > 0 ? artisanListings.map(listingToCraftObject) : products;
  const pendingOrders = artisanOrders.filter(o => o.status === "PLACED" || o.status === "CONFIRMED");
  const thisMonthEarnings = 18400; // demo figure

  // ---- SCREEN: HOME ----
  const HomeScreen = () => (
    <div className="a-dashboard">
      <div className="a-dashboard__greeting">
        <div className="a-dashboard__greeting-name">
          {t("artisan.greeting", "Hello, {{name}}!", { name: user?.name?.split(" ")[0] || t("artisan.artisan", "Artisan") })}
        </div>
        <div className="a-dashboard__greeting-sub">
          {user?.craftSpecialization || t("artisan.welcome_sub", "Welcome back to KAARIGAR")}
        </div>
      </div>

      {/* Earnings - big number + 2 bars */}
      <div className="a-earnings-card">
        <div className="a-earnings-card__label">{t("artisan.this_month", "Your earnings this month")}</div>
        <div className="a-earnings-card__amount" aria-label={`₹${thisMonthEarnings.toLocaleString("en-IN")} this month`}>
          ₹{thisMonthEarnings.toLocaleString("en-IN")}
        </div>
        <div className="a-earnings-card__tag">
          +₹12,400 {t("artisan.more_than_middleman", "more than a middleman would pay")}
        </div>
        <div className="a-earnings-bar-row" aria-label={t("artisan.earnings_comparison", "Earnings comparison")}>
          <div>
            <div className="a-earnings-bar-label">
              <span style={{ color: "var(--a-green)" }}>✅ {t("artisan.kaarigar_model", "With KAARIGAR (direct)")}</span>
              <strong style={{ color: "var(--a-green)" }}>₹18,400</strong>
            </div>
            <div className="a-earnings-bar-track">
              <div className="a-earnings-bar-fill a-earnings-bar-fill--kaarigar" style={{ width: "100%" }} />
            </div>
          </div>
          <div>
            <div className="a-earnings-bar-label">
              <span style={{ color: "#6B5645" }}>📦 {t("artisan.middleman", "Through a middleman")}</span>
              <strong>₹6,000</strong>
            </div>
            <div className="a-earnings-bar-track">
              <div className="a-earnings-bar-fill a-earnings-bar-fill--middleman" style={{ width: "32.6%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4 big action buttons */}
      <div className="a-home-actions" role="navigation" aria-label={t("artisan.quick_actions", "Quick actions")}>
        <Link
          to="/dashboard/create"
          className="a-home-action-btn a-home-action-btn--primary"
          id="home-add-product"
          aria-label={t("artisan.add_product", "Add a new product")}
        >
          <span className="a-home-action-btn__icon" aria-hidden="true">➕</span>
          {t("artisan.add_product", "Add a new product")}
        </Link>

        <button
          type="button"
          className="a-home-action-btn"
          onClick={() => setView("orders")}
          aria-label={t("artisan.my_orders", "My orders")}
        >
          <span className="a-home-action-btn__icon" aria-hidden="true">📦</span>
          <span className="a-home-action-btn__label">
            {t("artisan.my_orders", "My orders")}
            {pendingOrders.length > 0 && (
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--a-accent)" }}>
                {pendingOrders.length} {t("artisan.need_action", "need action")}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          className="a-home-action-btn"
          onClick={() => setView("pieces")}
          aria-label={t("artisan.my_pieces", "My products")}
        >
          <span className="a-home-action-btn__icon" aria-hidden="true">🎨</span>
          <span className="a-home-action-btn__label">{t("artisan.my_pieces", "My products")} ({displayPieces.length})</span>
        </button>

        <button
          type="button"
          className="a-home-action-btn"
          onClick={() => navigate("/commissions")}
          aria-label={t("artisan.custom_orders", "Custom orders")}
        >
          <span className="a-home-action-btn__icon" aria-hidden="true">✏️</span>
          <span className="a-home-action-btn__label">{t("artisan.custom_orders", "Custom orders")}</span>
        </button>
      </div>

      {/* Help link */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button type="button" className="a-home-action-btn" onClick={() => setView("profile")} style={{ maxWidth: "100%" }}>
          <span className="a-home-action-btn__icon" aria-hidden="true">👤</span>
          <span className="a-home-action-btn__label">{t("artisan.my_profile", "My profile")}</span>
        </button>
      </div>
    </div>
  );

  // ---- SCREEN: ORDERS ----
  const OrdersScreen = () => (
    <div className="a-pieces-section">
      <PageHeader backTo="" backLabel={t("common.back", "Back")} title={t("artisan.my_orders", "My orders")} />

      {undoQueue.map(u => (
        <div key={u.id} className="a-form-success" style={{ marginBottom: "0.75rem" }}>
          ✅ {t("artisan.status_updated", "Status updated.")}{" "}
          <button type="button" className="a-resend-btn" onClick={() => handleUndo(u)}>
            {t("artisan.undo", "Undo")} ({u.label})
          </button>
        </div>
      ))}

      {saveError && (
        <div className="a-form-error" role="alert">
          <span aria-hidden="true">⚠️</span> {saveError}
          <button type="button" style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSaveError("")}>✕</button>
        </div>
      )}

      {ordersLoading ? (
        <div className="a-loading-row" aria-live="polite">
          <div className="a-loading-spinner" aria-hidden="true" />
          {t("artisan.loading_orders", "Loading your orders…")}
        </div>
      ) : artisanOrders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--a-muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{t("artisan.no_orders", "No orders yet")}</h2>
          <p style={{ fontSize: "1rem" }}>{t("artisan.no_orders_hint", "When a buyer places an order, it will appear here.")}</p>
        </div>
      ) : (
        <div className="a-orders-list" aria-label={t("artisan.orders_list", "Orders list")}>
          {artisanOrders.map(ord => {
            const isBusy = orderActionLoading === ord.id;
            const firstItem = ord.items?.[0];
            const buyerName = (ord as any).buyer_name || t("artisan.buyer", "Buyer");

            return (
              <article key={ord.id} className="a-order-card">
                <div className="a-order-card__header">
                  <div className="a-order-card__photo-placeholder" aria-hidden="true">🧵</div>
                  <div className="a-order-card__info">
                    <div className="a-order-card__buyer">{buyerName.split(" ")[0]}</div>
                    <div className="a-order-card__item">
                      {firstItem?.listing_title || t("artisan.handcraft_piece", "Handcraft piece")}
                    </div>
                    <StatusBadge status={ord.status} />
                  </div>
                </div>

                <div style={{ fontSize: "1rem", color: "var(--a-muted)", marginBottom: "0.75rem" }}>
                  {t("artisan.order_value", "Order value:")} <strong>₹{ord.total_inr.toLocaleString("en-IN")}</strong>
                </div>

                {/* ONE next-step action button */}
                {confirmingOrder?.id === ord.id ? (
                  <div className="a-order-card__confirm-overlay" role="alertdialog" aria-modal="true">
                    <div className="a-order-card__confirm-q">{confirmingOrder.next === "CANCELLED"
                      ? t("artisan.confirm_cancel", "Cancel this order?")
                      : t("artisan.confirm_status", "Mark as {{status}}?", { status: confirmingOrder.next === "CONFIRMED" ? t("artisan.packed", "Packed") : t("artisan.shipped", "Shipped") })}
                    </div>
                    <div className="a-order-card__confirm-btns">
                      <BigButton variant="success" onClick={() => handleStatusTransition(ord.id, confirmingOrder.next)} disabled={isBusy}>
                        {isBusy ? "…" : t("artisan.yes_confirm", "Yes")}
                      </BigButton>
                      <BigButton variant="secondary" onClick={() => setConfirmingOrder(null)}>
                        {t("artisan.no_cancel", "No, go back")}
                      </BigButton>
                    </div>
                  </div>
                ) : (
                  <div className="a-order-card__action">
                    {ord.status === "PLACED" && (
                      <BigButton
                        variant="primary"
                        icon="📦"
                        onClick={() => setConfirmingOrder({ id: ord.id, next: "CONFIRMED" })}
                        id={`mark-packed-${ord.id}`}
                      >
                        {t("artisan.mark_packed", "Mark as packed")}
                      </BigButton>
                    )}
                    {ord.status === "CONFIRMED" && (
                      <BigButton
                        variant="success"
                        icon="🚚"
                        onClick={() => setConfirmingOrder({ id: ord.id, next: "SHIPPED" })}
                        id={`mark-shipped-${ord.id}`}
                      >
                        {t("artisan.mark_shipped", "Mark as shipped")}
                      </BigButton>
                    )}
                    {ord.status === "SHIPPED" && (
                      <BigButton
                        variant="secondary"
                        icon="✅"
                        onClick={() => setConfirmingOrder({ id: ord.id, next: "DELIVERED" })}
                      >
                        {t("artisan.mark_delivered", "Mark as delivered")}
                      </BigButton>
                    )}
                    {ord.status === "DELIVERED" && (
                      <div className="a-form-success" style={{ marginBottom: 0 }}>
                        ✅ {t("artisan.order_complete", "Order complete. Payment sent to your account.")}
                      </div>
                    )}
                    {ord.status !== "DELIVERED" && ord.status !== "CANCELLED" && (
                      <button
                        type="button"
                        className="a-order-card__undo"
                        onClick={() => setConfirmingOrder({ id: ord.id, next: "CANCELLED" })}
                        aria-label={t("artisan.cancel_order", "Cancel this order")}
                      >
                        {t("artisan.cancel_order", "Cancel this order")}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  // ---- SCREEN: MY PIECES ----
  const PiecesScreen = () => (
    <div className="a-pieces-section">
      <PageHeader backTo="" backLabel={t("common.back", "Back")} title={t("artisan.my_pieces", "My products")} />
      <div style={{ padding: "0 0 1rem" }}>
        <BigButton to="/dashboard/create" variant="primary" icon="➕">
          {t("artisan.add_product", "Add a new product")}
        </BigButton>
      </div>

      {loadingListings ? (
        <div className="a-loading-row" aria-live="polite">
          <div className="a-loading-spinner" aria-hidden="true" />
          {t("artisan.loading_pieces", "Loading your products…")}
        </div>
      ) : displayPieces.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--a-muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧵</div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{t("artisan.no_pieces", "No products yet")}</h2>
          <p style={{ fontSize: "1rem" }}>{t("artisan.no_pieces_hint", "Add your first product and it will appear in the gallery for buyers to see.")}</p>
        </div>
      ) : (
        <div aria-label={t("artisan.pieces_list", "Products list")}>
          {displayPieces.map(item => (
            <article key={item.id} className="a-piece-card">
              <img
                src={item.image}
                alt={item.title}
                className="a-piece-card__photo"
                loading="lazy"
                onError={e => handleImageError(e, getFallbackForCraft(item.craftTradition || item.category))}
              />
              <div className="a-piece-card__info">
                <div className="a-piece-card__title">{item.title}</div>
                <div className="a-piece-card__price">₹{item.price.toLocaleString("en-IN")}</div>
                <div className="a-piece-card__actions">
                  <BigButton to={`/dashboard/edit/${item.id}`} variant="secondary" small>
                    {t("artisan.edit", "Edit")}
                  </BigButton>
                  <BigButton variant="ghost" small onClick={() => setTagModalCraft(item)}>
                    🏷 {t("dashboard.print_tag", "Print tag")}
                  </BigButton>
                  {deleteConfirmId === item.id ? (
                    <>
                      <BigButton variant="danger" small onClick={() => handleDelete(item.id)}>
                        {t("artisan.yes_delete", "Yes, remove")}
                      </BigButton>
                      <BigButton variant="secondary" small onClick={() => setDeleteConfirmId(null)}>
                        {t("artisan.no_cancel", "No, keep")}
                      </BigButton>
                    </>
                  ) : (
                    <BigButton variant="danger" small onClick={() => setDeleteConfirmId(item.id)} ariaLabel={`${t("artisan.remove", "Remove")} ${item.title}`}>
                      {t("artisan.remove", "Remove")}
                    </BigButton>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  // ---- SCREEN: PROFILE ----
  const ProfileScreen = () => (
    <div className="a-pieces-section">
      <PageHeader backTo="" backLabel={t("common.back", "Back")} title={t("artisan.my_profile", "My profile")} />
      <form onSubmit={handleProfileSave}>
        <div className="a-form-group">
          <label className="a-form-label" htmlFor="p-name">{t("artisan.your_name", "Your name")}</label>
          <input id="p-name" type="text" className="a-form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="a-form-group">
          <label className="a-form-label" htmlFor="p-region">{t("artisan.your_village", "Your village or district")}</label>
          <input id="p-region" type="text" className="a-form-input" value={region} onChange={e => setRegion(e.target.value)} />
        </div>
        <div className="a-form-group">
          <label className="a-form-label" htmlFor="p-bio">{t("artisan.about_you", "Tell buyers about yourself and your craft")}</label>
          <textarea id="p-bio" className="a-form-input" rows={4} value={bio} onChange={e => setBio(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        {saveError && <div className="a-form-error" role="alert"><span>⚠️</span> {saveError}</div>}
        {savedNotice && <div className="a-form-success">✅ {t("artisan.profile_saved", "Profile saved!")}</div>}
        <BigButton type="submit" variant="primary">
          {t("artisan.save_profile", "Save my profile")}
        </BigButton>
        <div style={{ marginTop: "1rem" }}>
          <BigButton variant="danger" onClick={() => { logout(); navigate("/"); }}>
            {t("nav.logout", "Sign out")}
          </BigButton>
        </div>
      </form>
    </div>
  );

  return (
    <div className="artisan-screen" role="main" aria-label={t("artisan.dashboard_title", "Artisan dashboard")}>
      <OfflineBanner />

      {/* Accessible language bar at top of artisan screens */}
      <div className="a-lang-bar" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setShowLangSplash(true)}
          style={{
            background: 'var(--a-card-bg, #fff)',
            border: '2px solid var(--a-border, #d1c7bd)',
            borderRadius: '999px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
          aria-label={t("artisan.change_language", "Change language / ಭಾಷೆ ಬದಲಿಸಿ / भाषा बदलें")}
        >
          <span>🌐</span>
          <span>{i18n.language === 'kn' ? 'ಕನ್ನಡ' : i18n.language === 'hi' ? 'हिंदी' : 'English'}</span>
        </button>
      </div>

      {showLangSplash && <LangSplash onDone={() => setShowLangSplash(false)} />}

      {view === "home" && <HomeScreen />}
      {view === "orders" && <OrdersScreen />}
      {view === "pieces" && <PiecesScreen />}
      {view === "profile" && <ProfileScreen />}

      <HelpButton
        screenText={view === "home"
          ? t("artisan.help_home", "This is your home screen. You can add a new product, check orders, and see how much you have earned this month.")
          : view === "orders"
          ? t("artisan.help_orders", "These are the orders from buyers. Tap the button on each card to update the status.")
          : view === "pieces"
          ? t("artisan.help_pieces", "These are your listed products. Tap Edit to change a product, or Add to add a new one.")
          : t("artisan.help_profile", "Update your name and information so buyers can learn about you.")}
      />
      <BottomNav />

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
