import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createListing, publishListing, uploadListingImages, getPriceSuggestion,
  type PriceBreakdownResponse
} from "../api/listings";
import { StepWizard, BigButton, VoiceInputField, HelpButton, BottomNav, OfflineBanner } from "../components/artisan";
import "../artisan.css";

// Helper: compress image client-side before upload
async function compressImage(file: File, maxPx = 1200, quality = 0.75): Promise<File> {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(b => {
        if (!b) return res(file);
        const compressedFile = new File([b], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
        res(compressedFile);
      }, "image/webp", quality);
    };
    img.onerror = () => res(file);
    img.src = URL.createObjectURL(file);
  });
}

type Complexity = "low" | "medium" | "high" | "very_high";

const CRAFT_OPTIONS = [
  { key: "weaving",        emoji: "🧶", label: "Weaving" },
  { key: "pottery",        emoji: "🏺", label: "Pottery" },
  { key: "wood_carving",   emoji: "🪵", label: "Wood carving" },
  { key: "dhokra",         emoji: "🔔", label: "Metal casting" },
  { key: "embroidery",     emoji: "🪡", label: "Embroidery" },
  { key: "painting",       emoji: "🖌️", label: "Painting" },
  { key: "jewellery",      emoji: "💎", label: "Jewellery" },
  { key: "other",          emoji: "🎁", label: "Other" },
];

const TOTAL_STEPS = 5;

function useLocalDraft<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  const set = (v: T) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* quota */ } };
  return [val, set];
}

export default function CreateListing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Draft-persisted form fields
  const [photoFile, setPhotoFile] = useLocalDraft<null>("cl_photo", null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [craftType, setCraftType] = useLocalDraft<string>("cl_craft", "");
  const [title, setTitle] = useLocalDraft<string>("cl_title", "");
  const [description, setDescription] = useLocalDraft<string>("cl_desc", "");
  const [hours, setHours] = useLocalDraft<number>("cl_hours", 8);
  const [materialCost, setMaterialCost] = useLocalDraft<number>("cl_mat_cost", 500);
  const [complexity, setComplexity] = useLocalDraft<Complexity>("cl_complexity", "medium");
  const [priceResult, setPriceResult] = useState<PriceBreakdownResponse | null>(null);
  const [finalPrice, setFinalPrice] = useLocalDraft<number>("cl_price", 0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAdvance = (): boolean => {
    if (step === 1) return Boolean(photoPreview || photoFile);
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
      (setPhotoFile as any)(compressed);
    } catch {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      (setPhotoFile as any)(file);
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
      setError(t("artisan.price_error", "Could not get a price estimate right now. You can still enter your own price below."));
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
    setError("");
    // silently auto-save to localStorage already done via useLocalDraft
    // additionally create a backend draft if we have a craft type and title
    if (!craftType || !title) return;
    try {
      await createListing({ craft_type: craftType, title: title || "Draft", price_inr: finalPrice || 1 });
    } catch { /* offline ok */ }
  };

  const handleSubmit = async () => {
    if (!craftType || !title || !finalPrice) {
      setError(t("artisan.fill_required", "Please fill in all required fields."));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const listing = await createListing({
        craft_type: craftType,
        title,
        description,
        price_inr: finalPrice,
        hours_to_make: hours,
      });

      if (photoFile && typeof photoFile === "object" && (photoFile as unknown as File).size) {
        try {
          await uploadListingImages(listing.id, [photoFile as unknown as File]);
        } catch { /* image upload is optional */ }
      }

      await publishListing(listing.id);

      // Clear drafts
      ["cl_photo", "cl_craft", "cl_title", "cl_desc", "cl_hours", "cl_mat_cost", "cl_complexity", "cl_price"]
        .forEach(k => { try { localStorage.removeItem(k); } catch { /* */ } });

      navigate("/dashboard", { state: { published: true } });
    } catch {
      setError(t("artisan.publish_error", "Something went wrong. Please try again. Your draft is saved."));
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 1) { navigate("/dashboard"); return; }
    setStep(s => s - 1);
  };

  const goNext = () => setStep(s => s + 1);

  const craftLabel = CRAFT_OPTIONS.find(c => c.key === craftType)?.label || craftType;

  return (
    <div className="artisan-screen">
      <OfflineBanner />
      <StepWizard step={step} totalSteps={TOTAL_STEPS} onBack={goBack} onSaveDraft={handleSaveDraft}>

        {/* ---- STEP 1: PHOTO ---- */}
        {step === 1 && (
          <>
            <h1 className="a-wizard__step-title">
              {t("artisan.step1_title", "Take a photo of your work")}
            </h1>
            <p className="a-wizard__step-subtitle">
              {t("artisan.step1_sub", "A good photo helps buyers find your craft. Natural light is best.")}
            </p>
            <div className="a-wizard__content">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
                aria-label={t("artisan.choose_photo", "Choose or take a photo")}
                id="photo-upload"
              />
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt={t("artisan.photo_preview", "Your photo")} className="a-photo-preview" />
                  <div style={{ marginTop: "0.75rem" }}>
                    <BigButton variant="secondary" small onClick={() => fileInputRef.current?.click()}>
                      📷 {t("artisan.retake", "Take another photo")}
                    </BigButton>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="a-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  id="photo-btn"
                  aria-label={t("artisan.take_photo", "Open camera or gallery")}
                >
                  <span className="a-photo-btn__icon" aria-hidden="true">📷</span>
                  <span>{t("artisan.take_photo", "Tap here to take a photo or choose from gallery")}</span>
                </button>
              )}
            </div>
            <div className="a-wizard__footer">
              {error && <div className="a-form-error" role="alert"><span>⚠️</span> {error}</div>}
              <BigButton onClick={goNext} disabled={!canAdvance()}>
                {t("artisan.next", "Next step")} →
              </BigButton>
              <BigButton variant="secondary" onClick={goNext}>
                {t("artisan.skip_photo", "Skip for now")}
              </BigButton>
            </div>
          </>
        )}

        {/* ---- STEP 2: CRAFT TYPE ---- */}
        {step === 2 && (
          <>
            <h1 className="a-wizard__step-title">
              {t("artisan.step2_title", "What type of craft is this?")}
            </h1>
            <p className="a-wizard__step-subtitle">
              {t("artisan.step2_sub", "Tap one box to choose.")}
            </p>
            <div className="a-wizard__content">
              <div className="a-craft-cards" role="radiogroup" aria-label={t("artisan.craft_type", "Craft type")}>
                {CRAFT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    role="radio"
                    aria-checked={craftType === opt.key}
                    className={`a-craft-card${craftType === opt.key ? " a-craft-card--selected" : ""}`}
                    onClick={() => setCraftType(opt.key)}
                  >
                    <span className="a-craft-card__emoji" aria-hidden="true">{opt.emoji}</span>
                    <span>{t(`artisan.craft_${opt.key}`, opt.label)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="a-wizard__footer">
              <BigButton onClick={goNext} disabled={!canAdvance()}>
                {t("artisan.next", "Next step")} →
              </BigButton>
            </div>
          </>
        )}

        {/* ---- STEP 3: NAME + DESCRIPTION ---- */}
        {step === 3 && (
          <>
            <h1 className="a-wizard__step-title">
              {t("artisan.step3_title", "Give it a name and description")}
            </h1>
            <p className="a-wizard__step-subtitle">
              {t("artisan.step3_sub", "Describe your {{craft}} in your own words. You can speak or type.", { craft: craftLabel })}
            </p>
            <div className="a-wizard__content">
              <div className="a-form-group">
                <label className="a-form-label" htmlFor="cl-title">
                  {t("artisan.product_name", "Name of your product")} *
                </label>
                <input
                  id="cl-title"
                  type="text"
                  className="a-form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t("artisan.title_placeholder", "e.g. Hand-woven Ikat saree, blue and gold")}
                  required
                />
              </div>
              <VoiceInputField
                id="cl-description"
                label={t("artisan.tell_story", "Describe this piece — how you made it, materials used, time taken")}
                value={description}
                onChange={setDescription}
                placeholder={t("artisan.story_placeholder", "Speak or type your story here…")}
                rows={5}
              />
            </div>
            <div className="a-wizard__footer">
              {error && <div className="a-form-error" role="alert"><span>⚠️</span> {error}</div>}
              <BigButton onClick={goNext} disabled={!canAdvance()}>
                {t("artisan.next", "Next step")} →
              </BigButton>
            </div>
          </>
        )}

        {/* ---- STEP 4: TIME + MATERIALS ---- */}
        {step === 4 && (
          <>
            <h1 className="a-wizard__step-title">
              {t("artisan.step4_title", "How long did it take?")}
            </h1>
            <p className="a-wizard__step-subtitle">
              {t("artisan.step4_sub", "We use this to suggest a fair price for your work.")}
            </p>
            <div className="a-wizard__content">
              <div aria-label={t("artisan.hours_stepper", "Hours to make stepper")}>
                <div className="a-stepper">
                  <button
                    type="button"
                    className="a-stepper__btn"
                    onClick={() => setHours(Math.max(1, hours - 1))}
                    aria-label={t("artisan.decrease_hours", "Decrease hours")}
                    disabled={hours <= 1}
                  >−</button>
                  <div>
                    <div className="a-stepper__value" aria-live="polite">{hours}</div>
                    <div className="a-stepper__unit">{t("artisan.hours", "hours")}</div>
                  </div>
                  <button
                    type="button"
                    className="a-stepper__btn"
                    onClick={() => setHours(hours + 1)}
                    aria-label={t("artisan.increase_hours", "Increase hours")}
                  >+</button>
                </div>
              </div>

              <div className="a-form-group">
                <label className="a-form-label" htmlFor="mat-cost">
                  {t("artisan.material_cost", "Cost of materials you bought (₹)")}
                </label>
                <input
                  id="mat-cost"
                  type="number"
                  className="a-form-input"
                  value={materialCost}
                  min={0}
                  step={50}
                  onChange={e => setMaterialCost(Number(e.target.value))}
                  inputMode="numeric"
                />
                <p className="a-form-hint">{t("artisan.mat_hint", "Thread, clay, dye, paint — everything you spent money on.")}</p>
              </div>

              <div className="a-form-group">
                <label className="a-form-label">{t("artisan.complexity", "How difficult is this piece?")}</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {([["low","Simple"], ["medium","Medium"], ["high","Complex"], ["very_high","Very complex"]] as const).map(([val, fallback]) => (
                    <button
                      key={val}
                      type="button"
                      className={`a-craft-card${complexity === val ? " a-craft-card--selected" : ""}`}
                      role="radio"
                      aria-checked={complexity === val}
                      onClick={() => setComplexity(val as Complexity)}
                      style={{ flex: "1 1 45%", minHeight: "56px", minWidth: "100px" }}
                    >
                      {t(`artisan.complexity_${val}`, fallback)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="a-wizard__footer">
              <BigButton onClick={goNext}>
                {t("artisan.next", "Next step")} →
              </BigButton>
            </div>
          </>
        )}

        {/* ---- STEP 5: PRICE ---- */}
        {step === 5 && (
          <>
            <h1 className="a-wizard__step-title">
              {t("artisan.step5_title", "Set your price")}
            </h1>
            <p className="a-wizard__step-subtitle">
              {t("artisan.step5_sub", "You can use our suggested fair price, or set your own.")}
            </p>
            <div className="a-wizard__content">
              {!priceResult && (
                <BigButton
                  variant="secondary"
                  onClick={handleGetPriceEstimate}
                  disabled={loading}
                  icon="✨"
                  id="get-price-btn"
                >
                  {loading ? t("artisan.calculating", "Calculating…") : t("artisan.get_fair_price", "Get a fair price suggestion")}
                </BigButton>
              )}
              {priceResult ? (
                <div className="a-price-review">
                  <div className="a-price-review__label">{t("artisan.suggested_price_tag", "We suggest:")}</div>
                  <div className="a-price-review__amount" style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--a-green, #1e7e34)" }}>
                    ₹{priceResult.suggested_price.toLocaleString("en-IN")}
                  </div>
                  <div className="a-price-review__breakdown" style={{ marginTop: "0.75rem", fontSize: "1rem" }}>
                    <strong>{t("artisan.how_calc", "How we worked this out:")}</strong><br />
                    • {t("artisan.materials_label", "Materials:")} ₹{priceResult.materials_cost.toLocaleString("en-IN")}<br />
                    • {t("artisan.labour_label", "Your time ({h}h × ₹{r}/hr):", { h: priceResult.hours, r: priceResult.fair_hourly_wage })}: ₹{priceResult.labour_cost.toLocaleString("en-IN")}<br />
                    • {t("artisan.heritage_label", "Craft heritage:")} ₹{priceResult.craft_premium_amount.toLocaleString("en-IN")}<br />
                    • {t("artisan.range_label", "Suggested range:")} ₹{priceResult.suggested_range.min.toLocaleString("en-IN")} – ₹{priceResult.suggested_range.max.toLocaleString("en-IN")}
                  </div>

                  {!finalPrice && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <BigButton
                        variant="success"
                        onClick={() => setFinalPrice(priceResult.suggested_price)}
                      >
                        👍 {t("artisan.looks_good", "Looks good (₹{{price}})", { price: priceResult.suggested_price.toLocaleString("en-IN") })}
                      </BigButton>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Price input - either prefilled or customized */}
              <div className="a-form-group" style={{ marginTop: "1.25rem" }}>
                <label className="a-form-label" htmlFor="final-price">
                  {t("artisan.your_price", "Your selling price (₹)")} *
                </label>
                <input
                  id="final-price"
                  type="number"
                  className="a-form-input"
                  value={finalPrice || ""}
                  min={1}
                  step={50}
                  onChange={e => setFinalPrice(Number(e.target.value))}
                  inputMode="numeric"
                  required
                  aria-describedby="price-hint"
                />
                <p id="price-hint" className="a-form-hint">
                  {t("artisan.price_hint", "This is the amount buyers will pay. You keep most of it.")}
                </p>
              </div>
              {error && <div className="a-form-error" role="alert"><span>⚠️</span> {error}</div>}
            </div>
            <div className="a-wizard__footer">
              <BigButton
                variant="primary"
                onClick={handleSubmit}
                disabled={loading || !canAdvance()}
                id="publish-btn"
              >
                {loading ? t("artisan.publishing", "Publishing…") : `🚀 ${t("artisan.publish", "Looks good — Publish my product")}`}
              </BigButton>
              <BigButton variant="secondary" onClick={handleSaveDraft} disabled={loading}>
                {t("artisan.save_draft", "Save as draft")}
              </BigButton>
            </div>
          </>
        )}

      </StepWizard>

      <HelpButton
        screenText={
          step === 1 ? t("artisan.help_step1", "Tap the big box to take a photo of your craft with your phone camera, or choose one from your gallery.")
          : step === 2 ? t("artisan.help_step2", "Tap the box that matches what you make.")
          : step === 3 ? t("artisan.help_step3", "Type or speak the name and description of your craft. Use the microphone button to speak.")
          : step === 4 ? t("artisan.help_step4", "Use the plus and minus buttons to set how many hours you spent making this piece. Also enter how much you spent on materials.")
          : t("artisan.help_step5", "Tap Get a fair price suggestion to let us calculate a price based on your time and materials. Then you can change it if you want.")
        }
      />
      <BottomNav />
    </div>
  );
}
