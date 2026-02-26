"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export interface PropertyFormValues {
  // Core
  title: string;
  subject: string;
  location: string;
  description: string;
  type: string;
  category: string;
  investmentType: string;
  investmentStatus: string;
  riskLevel: string;
  // Financial
  price: string;
  minInvestment: string;
  maxInvestment: string;
  targetAmount: string;
  monthlyReturn: string;
  duration: string;
  // Property details
  bedrooms: string;
  bathrooms: string;
  parking: string;
  sqft: string;
  features: string;
  // Map coordinates
  latitude: string;
  longitude: string;
  // Manager
  managerName: string;
  managerRole: string;
  managerPhone: string;
  // Flags
  isFeatured: boolean;
  isActive: boolean;

  // ── For Sale: Interior ──
  fullBathrooms: string;
  heating: string;
  cooling: string;
  appliancesIncluded: string;
  laundry: string;
  interiorFeatures: string;
  flooring: string;
  windows: string;
  basement: string;
  fireplaceCount: string;
  fireplaceFeatures: string;
  totalStructureArea: string;
  totalLivableArea: string;

  // ── For Sale: Exterior ──
  levels: string;
  stories: string;
  patioAndPorch: string;
  exteriorFeatures: string;
  poolFeatures: string;
  hasSpa: boolean;
  spaFeatures: string;
  fencing: string;

  // ── For Sale: Lot ──
  lotFeatures: string;
  additionalStructures: string;
  parcelNumber: string;

  // ── For Sale: Construction ──
  homeType: string;
  propertySubtype: string;
  constructionMaterials: string;
  foundation: string;
  roof: string;
  yearBuilt: string;

  // ── For Sale: Utilities ──
  sewer: string;
  water: string;
  utilitiesForProperty: string;

  // ── For Sale: Community & HOA ──
  communityFeatures: string;
  security: string;
  subdivision: string;
  hasHOA: boolean;
  hoaFee: string;
  region: string;

  // ── For Sale: Listing & Tax ──
  pricePerSqft: string;
  taxAssessedValue: string;
  annualTaxAmount: string;
  dateOnMarket: string;
  daysOnMarket: string;
  listingTerms: string;

  // ── For Sale: Market Value ──
  zestimate: string;
  estimatedSalesRangeLow: string;
  estimatedSalesRangeHigh: string;
  rentZestimate: string;
  zestimateChangePercent: string;
  zestimateChangeYears: string;

  // ── For Sale: Climate Risks ──
  floodZone: string;
  floodZoneDescription: string;
  fireRisk: string;
  windRisk: string;
  airQualityRisk: string;
  firstStreetUrl: string;

  // ── For Sale: Getting Around ──
  walkScore: string;
  walkScoreDescription: string;
  bikeScore: string;
  bikeScoreDescription: string;
  transitScore: string;
  transitScoreDescription: string;
}

export const DEFAULT_VALUES: PropertyFormValues = {
  title: "", subject: "", location: "", description: "", type: "",
  category: "airbnb_arbitrage", investmentType: "pooled",
  investmentStatus: "open", riskLevel: "",
  price: "", minInvestment: "", maxInvestment: "", targetAmount: "",
  monthlyReturn: "", duration: "",
  bedrooms: "", bathrooms: "", parking: "", sqft: "", features: "",
  latitude: "", longitude: "",
  managerName: "", managerRole: "", managerPhone: "",
  isFeatured: false, isActive: true,
  fullBathrooms: "", heating: "", cooling: "", appliancesIncluded: "",
  laundry: "", interiorFeatures: "", flooring: "", windows: "", basement: "",
  fireplaceCount: "", fireplaceFeatures: "", totalStructureArea: "", totalLivableArea: "",
  levels: "", stories: "", patioAndPorch: "", exteriorFeatures: "", poolFeatures: "",
  hasSpa: false, spaFeatures: "", fencing: "",
  lotFeatures: "", additionalStructures: "", parcelNumber: "",
  homeType: "", propertySubtype: "", constructionMaterials: "", foundation: "",
  roof: "", yearBuilt: "",
  sewer: "", water: "", utilitiesForProperty: "",
  communityFeatures: "", security: "", subdivision: "", hasHOA: false, hoaFee: "", region: "",
  pricePerSqft: "", taxAssessedValue: "", annualTaxAmount: "", dateOnMarket: "",
  daysOnMarket: "", listingTerms: "",
  zestimate: "", estimatedSalesRangeLow: "", estimatedSalesRangeHigh: "",
  rentZestimate: "", zestimateChangePercent: "", zestimateChangeYears: "",
  floodZone: "", floodZoneDescription: "", fireRisk: "", windRisk: "",
  airQualityRisk: "", firstStreetUrl: "",
  walkScore: "", walkScoreDescription: "", bikeScore: "", bikeScoreDescription: "",
  transitScore: "", transitScoreDescription: "",
};

interface PropertyFormProps {
  initialValues?: Partial<PropertyFormValues>;
  existingImages?: string[];
  propertyId?: string;
  mode: "create" | "edit";
}

export default function PropertyForm({
  initialValues,
  existingImages = [],
  propertyId,
  mode,
}: PropertyFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });
  const [images, setImages] = useState<File[]>([]);
  const [managerPhotoFile, setManagerPhotoFile] = useState<File | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>(existingImages);
  const [removingImage, setRemovingImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const managerPhotoRef = useRef<HTMLInputElement>(null);

  // ── Field selection (edit mode only) ─────────────────────────────────────
  // All fields start checked so everything can be updated, even empty ones.
  const allKeys = Object.keys(DEFAULT_VALUES) as (keyof PropertyFormValues)[];
  const [enabledFields, setEnabledFields] = useState<Set<keyof PropertyFormValues>>(
    () => new Set(allKeys)
  );
  // New images checkbox: whether new uploads are included in this PATCH
  // Default false in edit mode so field-only updates use the fast JSON path
  const [newImagesEnabled, setNewImagesEnabled] = useState(mode === "create");

  function toggleField(key: keyof PropertyFormValues) {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Select all / deselect all fields + the new-images checkbox
  function toggleAllFields() {
    const allSelected = enabledFields.size === allKeys.length && newImagesEnabled;
    if (allSelected) {
      setEnabledFields(new Set());
      setNewImagesEnabled(false);
    } else {
      setEnabledFields(new Set(allKeys));
      setNewImagesEnabled(true);
    }
  }

  // Spreads checkbox props onto <Field> in edit mode
  const ef = (key: keyof PropertyFormValues) =>
    mode === "edit"
      ? { fieldKey: key, enabled: enabledFields.has(key), onToggle: () => toggleField(key) }
      : {};

  // Same pattern for <Toggle> components
  const te = (key: keyof PropertyFormValues) =>
    mode === "edit"
      ? { enableField: enabledFields.has(key), onEnableToggle: () => toggleField(key) }
      : {};
  // ─────────────────────────────────────────────────────────────────────────

  const set = (field: keyof PropertyFormValues, value: any) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const isForSale = values.category === "for_sale";

  function handleInvestmentTypeChange(val: string) {
    set("investmentType", val);
    if (val === "pooled" && values.category === "for_sale") {
      set("category", "airbnb_arbitrage");
    }
  }

  function handleCategoryChange(val: string) {
    set("category", val);
    if (val === "for_sale" && values.investmentType === "pooled") {
      set("investmentType", "individual");
    }
  }

  async function handleRemoveExistingImage(url: string) {
    if (!propertyId) return;
    setRemovingImage(url);
    try {
      const res = await api.adminRemovePropertyImage(propertyId, url);
      if (res.success) {
        setCurrentImages((prev) => prev.filter((img) => img !== url));
      }
    } catch {
      // ignore
    } finally {
      setRemovingImage(null);
    }
  }

  const forSaleOnly = new Set([
    "fullBathrooms", "heating", "cooling", "appliancesIncluded", "laundry",
    "interiorFeatures", "flooring", "windows", "basement", "fireplaceCount",
    "fireplaceFeatures", "totalStructureArea", "totalLivableArea",
    "levels", "stories", "patioAndPorch", "exteriorFeatures", "poolFeatures",
    "hasSpa", "spaFeatures", "fencing",
    "lotFeatures", "additionalStructures", "parcelNumber",
    "homeType", "propertySubtype", "constructionMaterials", "foundation", "roof", "yearBuilt",
    "sewer", "water", "utilitiesForProperty",
    "communityFeatures", "security", "subdivision", "hasHOA", "hoaFee", "region",
    "pricePerSqft", "taxAssessedValue", "annualTaxAmount", "dateOnMarket", "daysOnMarket", "listingTerms",
    "zestimate", "estimatedSalesRangeLow", "estimatedSalesRangeHigh", "rentZestimate",
    "zestimateChangePercent", "zestimateChangeYears",
    "floodZone", "floodZoneDescription", "fireRisk", "windRisk", "airQualityRisk", "firstStreetUrl",
    "walkScore", "walkScoreDescription", "bikeScore", "bikeScoreDescription",
    "transitScore", "transitScoreDescription",
  ]);

  function buildFields(): Record<string, string> {
    const obj: Record<string, string> = {};
    (Object.keys(values) as (keyof PropertyFormValues)[]).forEach((key) => {
      if (!isForSale && forSaleOnly.has(key)) return;
      if (mode === "edit" && !enabledFields.has(key)) return;
      const val = values[key];
      if (val === "" || val === null || val === undefined) return;
      obj[key] = String(val);
    });
    return obj;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "create" || enabledFields.has("title")) {
      if (!values.title.trim()) { setError("Title is required."); return; }
    }
    if (mode === "create" || enabledFields.has("location")) {
      if (!values.location.trim()) { setError("Location is required."); return; }
    }
    setSaving(true);
    try {
      const fields = buildFields();
      // Include new images only in create mode, or if the "Add New Images" box is checked
      const includeNewImages = mode === "create" || newImagesEnabled;
      const hasFiles = (images.length > 0 && includeNewImages) || !!managerPhotoFile;
      let res;

      if (mode === "create" || hasFiles) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
        if (includeNewImages) {
          images.forEach((file) => fd.append("images", file));
        }
        if (managerPhotoFile) fd.append("managerPhoto", managerPhotoFile);
        res = mode === "create"
          ? await api.adminCreateProperty(fd)
          : await api.adminUpdateProperty(propertyId!, fd);
      } else {
        res = await api.adminUpdatePropertyJson(propertyId!, fields);
      }

      if (res.success) {
        router.push("/admin/properties");
        router.refresh();
      } else {
        setError((res as any).message || "Failed to save property.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save property.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Edit-mode hint + select-all toggle */}
      {mode === "edit" && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            <strong>Selective update:</strong> Only <strong>checked</strong> fields will be sent in
            the PATCH. Uncheck any field you don't want to change.
          </span>
          <button
            type="button"
            onClick={toggleAllFields}
            className="ml-4 flex-shrink-0 rounded border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            {enabledFields.size === allKeys.length && newImagesEnabled ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {/* ── Basic Info ── */}
      <Section title="Basic Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" required={mode === "create"} {...ef("title")}>
            <input type="text" value={values.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Luxury Airbnb in Miami" className={inputCls} />
          </Field>
          <Field label="Subject / Short Tagline" {...ef("subject")}>
            <input type="text" value={values.subject} onChange={(e) => set("subject", e.target.value)}
              placeholder="Brief headline" className={inputCls} />
          </Field>
          <Field label="Location" required={mode === "create"} {...ef("location")}>
            <input type="text" value={values.location} onChange={(e) => set("location", e.target.value)}
              placeholder="City, State" className={inputCls} />
          </Field>
          <Field label="Property Type" {...ef("type")}>
            <input type="text" value={values.type} onChange={(e) => set("type", e.target.value)}
              placeholder="e.g. Apartment, House, Condo" className={inputCls} />
          </Field>
        </div>
        <Field label="Description" {...ef("description")}>
          <textarea value={values.description} onChange={(e) => set("description", e.target.value)}
            rows={4} placeholder="Detailed description..." className={inputCls} />
        </Field>
      </Section>

      {/* ── Investment Settings ── */}
      <Section title="Investment Settings">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Investment Type" {...ef("investmentType")}>
            <select value={values.investmentType} onChange={(e) => handleInvestmentTypeChange(e.target.value)} className={inputCls}>
              <option value="pooled">Pooled</option>
              <option value="individual">Individual</option>
            </select>
          </Field>
          <Field label="Category" {...ef("category")}>
            <select value={values.category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls}>
              <option value="airbnb_arbitrage">Airbnb Arbitrage</option>
              <option value="airbnb_mortgage">Airbnb Mortgage</option>
              <option value="for_sale">For Sale (Individual only)</option>
            </select>
            {isForSale && <p className="mt-1 text-xs text-blue-600">Investment type auto-set to Individual.</p>}
          </Field>
          <Field label="Investment Status" {...ef("investmentStatus")}>
            <select value={values.investmentStatus} onChange={(e) => set("investmentStatus", e.target.value)} className={inputCls}>
              <option value="open">Open</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="funded">Funded</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
          <Field label="Risk Level" {...ef("riskLevel")}>
            <select value={values.riskLevel} onChange={(e) => set("riskLevel", e.target.value)} className={inputCls}>
              <option value="">Select risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Financials ── */}
      <Section title="Financials">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Price ($)" {...ef("price")}>
            <input type="number" min="0" step="0.01" value={values.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Min Investment ($)" {...ef("minInvestment")}>
            <input type="number" min="0" step="0.01" value={values.minInvestment} onChange={(e) => set("minInvestment", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Max Investment ($)" {...ef("maxInvestment")}>
            <input type="number" min="0" step="0.01" value={values.maxInvestment} onChange={(e) => set("maxInvestment", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Target Amount ($)" {...ef("targetAmount")}>
            <input type="number" min="0" step="0.01" value={values.targetAmount} onChange={(e) => set("targetAmount", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Monthly Return (%)" {...ef("monthlyReturn")}>
            <input type="number" min="0" step="0.01" value={values.monthlyReturn} onChange={(e) => set("monthlyReturn", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Duration (months)" {...ef("duration")}>
            <input type="number" min="0" step="1" value={values.duration} onChange={(e) => set("duration", e.target.value)} placeholder="12" className={inputCls} />
          </Field>
        </div>
        {values.monthlyReturn && values.duration && (
          <p className="mt-1 text-xs text-gray-500">
            Expected ROI (auto-computed): {(parseFloat(values.monthlyReturn || "0") * parseInt(values.duration || "0")).toFixed(2)}%
          </p>
        )}
        {isForSale && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
            <Field label="Price per Sq Ft" {...ef("pricePerSqft")}>
              <input type="text" value={values.pricePerSqft} onChange={(e) => set("pricePerSqft", e.target.value)} placeholder="e.g. $250" className={inputCls} />
            </Field>
            <Field label="Tax Assessed Value" {...ef("taxAssessedValue")}>
              <input type="text" value={values.taxAssessedValue} onChange={(e) => set("taxAssessedValue", e.target.value)} placeholder="e.g. $320,000" className={inputCls} />
            </Field>
            <Field label="Annual Tax Amount" {...ef("annualTaxAmount")}>
              <input type="text" value={values.annualTaxAmount} onChange={(e) => set("annualTaxAmount", e.target.value)} placeholder="e.g. $4,500" className={inputCls} />
            </Field>
            <Field label="Date on Market" {...ef("dateOnMarket")}>
              <input type="date" value={values.dateOnMarket} onChange={(e) => set("dateOnMarket", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Days on Market" {...ef("daysOnMarket")}>
              <input type="number" min="0" value={values.daysOnMarket} onChange={(e) => set("daysOnMarket", e.target.value)} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Listing Terms (comma-separated)" {...ef("listingTerms")}>
              <input type="text" value={values.listingTerms} onChange={(e) => set("listingTerms", e.target.value)} placeholder="Cash, Conventional, FHA" className={inputCls} />
            </Field>
          </div>
        )}
      </Section>

      {/* ── Property Details ── */}
      <Section title="Property Details">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Bedrooms" {...ef("bedrooms")}>
            <input type="number" min="0" value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Bathrooms" {...ef("bathrooms")}>
            <input type="number" min="0" value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Parking" {...ef("parking")}>
            <input type="number" min="0" value={values.parking} onChange={(e) => set("parking", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <Field label="Sq Ft" {...ef("sqft")}>
            <input type="number" min="0" value={values.sqft} onChange={(e) => set("sqft", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
        </div>
        <Field label="Features (comma-separated)" {...ef("features")}>
          <input type="text" value={values.features} onChange={(e) => set("features", e.target.value)} placeholder="Pool, Gym, Rooftop, Parking" className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Latitude" {...ef("latitude")}>
            <input type="number" step="any" value={values.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="e.g. 25.7617" className={inputCls} />
          </Field>
          <Field label="Longitude" {...ef("longitude")}>
            <input type="number" step="any" value={values.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="e.g. -80.1918" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* ════ FOR SALE ONLY SECTIONS ════ */}
      {isForSale && (
        <>
          {/* ── Interior ── */}
          <Section title="Interior">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Full Bathrooms" {...ef("fullBathrooms")}>
                <input type="number" min="0" value={values.fullBathrooms} onChange={(e) => set("fullBathrooms", e.target.value)} placeholder="0" className={inputCls} />
              </Field>
              <Field label="Fireplace Count" {...ef("fireplaceCount")}>
                <input type="number" min="0" value={values.fireplaceCount} onChange={(e) => set("fireplaceCount", e.target.value)} placeholder="0" className={inputCls} />
              </Field>
              <Field label="Basement" {...ef("basement")}>
                <input type="text" value={values.basement} onChange={(e) => set("basement", e.target.value)} placeholder="e.g. Full, Partial, None" className={inputCls} />
              </Field>
              <Field label="Total Structure Area" {...ef("totalStructureArea")}>
                <input type="text" value={values.totalStructureArea} onChange={(e) => set("totalStructureArea", e.target.value)} placeholder="e.g. 2,800 sqft" className={inputCls} />
              </Field>
              <Field label="Total Livable Area" {...ef("totalLivableArea")}>
                <input type="text" value={values.totalLivableArea} onChange={(e) => set("totalLivableArea", e.target.value)} placeholder="e.g. 2,400 sqft" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Heating (comma-separated)" {...ef("heating")}>
                <input type="text" value={values.heating} onChange={(e) => set("heating", e.target.value)} placeholder="Forced Air, Electric" className={inputCls} />
              </Field>
              <Field label="Cooling (comma-separated)" {...ef("cooling")}>
                <input type="text" value={values.cooling} onChange={(e) => set("cooling", e.target.value)} placeholder="Central Air, Wall Unit" className={inputCls} />
              </Field>
              <Field label="Appliances Included (comma-separated)" {...ef("appliancesIncluded")}>
                <input type="text" value={values.appliancesIncluded} onChange={(e) => set("appliancesIncluded", e.target.value)} placeholder="Refrigerator, Washer, Dryer" className={inputCls} />
              </Field>
              <Field label="Laundry (comma-separated)" {...ef("laundry")}>
                <input type="text" value={values.laundry} onChange={(e) => set("laundry", e.target.value)} placeholder="In Unit, Hookups" className={inputCls} />
              </Field>
              <Field label="Interior Features (comma-separated)" {...ef("interiorFeatures")}>
                <input type="text" value={values.interiorFeatures} onChange={(e) => set("interiorFeatures", e.target.value)} placeholder="Open Floor Plan, High Ceilings" className={inputCls} />
              </Field>
              <Field label="Flooring (comma-separated)" {...ef("flooring")}>
                <input type="text" value={values.flooring} onChange={(e) => set("flooring", e.target.value)} placeholder="Hardwood, Tile, Carpet" className={inputCls} />
              </Field>
              <Field label="Windows (comma-separated)" {...ef("windows")}>
                <input type="text" value={values.windows} onChange={(e) => set("windows", e.target.value)} placeholder="Double Pane, Storm Windows" className={inputCls} />
              </Field>
              <Field label="Fireplace Features (comma-separated)" {...ef("fireplaceFeatures")}>
                <input type="text" value={values.fireplaceFeatures} onChange={(e) => set("fireplaceFeatures", e.target.value)} placeholder="Gas, Wood Burning" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Exterior ── */}
          <Section title="Exterior">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Levels" {...ef("levels")}>
                <input type="text" value={values.levels} onChange={(e) => set("levels", e.target.value)} placeholder="e.g. Two, Three or More" className={inputCls} />
              </Field>
              <Field label="Stories" {...ef("stories")}>
                <input type="number" min="0" value={values.stories} onChange={(e) => set("stories", e.target.value)} placeholder="0" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Patio & Porch (comma-separated)" {...ef("patioAndPorch")}>
                <input type="text" value={values.patioAndPorch} onChange={(e) => set("patioAndPorch", e.target.value)} placeholder="Deck, Covered Porch, Balcony" className={inputCls} />
              </Field>
              <Field label="Exterior Features (comma-separated)" {...ef("exteriorFeatures")}>
                <input type="text" value={values.exteriorFeatures} onChange={(e) => set("exteriorFeatures", e.target.value)} placeholder="Rain Gutters, Irrigation System" className={inputCls} />
              </Field>
              <Field label="Pool Features (comma-separated)" {...ef("poolFeatures")}>
                <input type="text" value={values.poolFeatures} onChange={(e) => set("poolFeatures", e.target.value)} placeholder="Heated, In Ground, Salt Water" className={inputCls} />
              </Field>
              <Field label="Fencing (comma-separated)" {...ef("fencing")}>
                <input type="text" value={values.fencing} onChange={(e) => set("fencing", e.target.value)} placeholder="Wood, Vinyl, Chain Link" className={inputCls} />
              </Field>
              <Field label="Spa Features (comma-separated)" {...ef("spaFeatures")}>
                <input type="text" value={values.spaFeatures} onChange={(e) => set("spaFeatures", e.target.value)} placeholder="Heated, In Ground" className={inputCls} />
              </Field>
            </div>
            <Toggle label="Has Spa" checked={values.hasSpa} onChange={(v) => set("hasSpa", v)} {...te("hasSpa")} />
          </Section>

          {/* ── Lot ── */}
          <Section title="Lot">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Lot Features (comma-separated)" {...ef("lotFeatures")}>
                <input type="text" value={values.lotFeatures} onChange={(e) => set("lotFeatures", e.target.value)} placeholder="Corner Lot, Cul-De-Sac" className={inputCls} />
              </Field>
              <Field label="Additional Structures" {...ef("additionalStructures")}>
                <input type="text" value={values.additionalStructures} onChange={(e) => set("additionalStructures", e.target.value)} placeholder="e.g. Guest House, Shed" className={inputCls} />
              </Field>
              <Field label="Parcel Number" {...ef("parcelNumber")}>
                <input type="text" value={values.parcelNumber} onChange={(e) => set("parcelNumber", e.target.value)} placeholder="e.g. 01-4138-007-0010" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Construction ── */}
          <Section title="Construction">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Home Type" {...ef("homeType")}>
                <input type="text" value={values.homeType} onChange={(e) => set("homeType", e.target.value)} placeholder="e.g. Single Family" className={inputCls} />
              </Field>
              <Field label="Property Subtype" {...ef("propertySubtype")}>
                <input type="text" value={values.propertySubtype} onChange={(e) => set("propertySubtype", e.target.value)} placeholder="e.g. Residential" className={inputCls} />
              </Field>
              <Field label="Year Built" {...ef("yearBuilt")}>
                <input type="number" min="1800" max="2100" value={values.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} placeholder="e.g. 2005" className={inputCls} />
              </Field>
              <Field label="Construction Materials (comma-separated)" {...ef("constructionMaterials")}>
                <input type="text" value={values.constructionMaterials} onChange={(e) => set("constructionMaterials", e.target.value)} placeholder="Stucco, Block, CBS" className={inputCls} />
              </Field>
              <Field label="Foundation (comma-separated)" {...ef("foundation")}>
                <input type="text" value={values.foundation} onChange={(e) => set("foundation", e.target.value)} placeholder="Slab, Block" className={inputCls} />
              </Field>
              <Field label="Roof (comma-separated)" {...ef("roof")}>
                <input type="text" value={values.roof} onChange={(e) => set("roof", e.target.value)} placeholder="Tile, Metal, Shingle" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Utilities ── */}
          <Section title="Utilities">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Sewer (comma-separated)" {...ef("sewer")}>
                <input type="text" value={values.sewer} onChange={(e) => set("sewer", e.target.value)} placeholder="Public Sewer" className={inputCls} />
              </Field>
              <Field label="Water (comma-separated)" {...ef("water")}>
                <input type="text" value={values.water} onChange={(e) => set("water", e.target.value)} placeholder="Public" className={inputCls} />
              </Field>
              <Field label="Utilities (comma-separated)" {...ef("utilitiesForProperty")}>
                <input type="text" value={values.utilitiesForProperty} onChange={(e) => set("utilitiesForProperty", e.target.value)} placeholder="Electricity Connected, Cable Available" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Community & HOA ── */}
          <Section title="Community & HOA">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Subdivision" {...ef("subdivision")}>
                <input type="text" value={values.subdivision} onChange={(e) => set("subdivision", e.target.value)} placeholder="e.g. Brickell Heights" className={inputCls} />
              </Field>
              <Field label="Region" {...ef("region")}>
                <input type="text" value={values.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. South Florida" className={inputCls} />
              </Field>
              <Field label="HOA Fee" {...ef("hoaFee")}>
                <input type="text" value={values.hoaFee} onChange={(e) => set("hoaFee", e.target.value)} placeholder="e.g. $250/month" className={inputCls} />
              </Field>
              <Field label="Community Features (comma-separated)" {...ef("communityFeatures")}>
                <input type="text" value={values.communityFeatures} onChange={(e) => set("communityFeatures", e.target.value)} placeholder="Pool, Gym, Clubhouse" className={inputCls} />
              </Field>
              <Field label="Security (comma-separated)" {...ef("security")}>
                <input type="text" value={values.security} onChange={(e) => set("security", e.target.value)} placeholder="Gated, Security Guard" className={inputCls} />
              </Field>
            </div>
            <Toggle label="Has HOA" checked={values.hasHOA} onChange={(v) => set("hasHOA", v)} {...te("hasHOA")} />
          </Section>

          {/* ── Market Value ── */}
          <Section title="Market Value (Zestimate)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Zestimate" {...ef("zestimate")}>
                <input type="text" value={values.zestimate} onChange={(e) => set("zestimate", e.target.value)} placeholder="e.g. $850,000" className={inputCls} />
              </Field>
              <Field label="Est. Sales Range Low" {...ef("estimatedSalesRangeLow")}>
                <input type="text" value={values.estimatedSalesRangeLow} onChange={(e) => set("estimatedSalesRangeLow", e.target.value)} placeholder="e.g. $800,000" className={inputCls} />
              </Field>
              <Field label="Est. Sales Range High" {...ef("estimatedSalesRangeHigh")}>
                <input type="text" value={values.estimatedSalesRangeHigh} onChange={(e) => set("estimatedSalesRangeHigh", e.target.value)} placeholder="e.g. $900,000" className={inputCls} />
              </Field>
              <Field label="Rent Zestimate" {...ef("rentZestimate")}>
                <input type="text" value={values.rentZestimate} onChange={(e) => set("rentZestimate", e.target.value)} placeholder="e.g. $3,200/mo" className={inputCls} />
              </Field>
              <Field label="Zestimate Change (%)" {...ef("zestimateChangePercent")}>
                <input type="text" value={values.zestimateChangePercent} onChange={(e) => set("zestimateChangePercent", e.target.value)} placeholder="e.g. 3.5" className={inputCls} />
              </Field>
              <Field label="Zestimate Change Over (years)" {...ef("zestimateChangeYears")}>
                <input type="number" min="0" value={values.zestimateChangeYears} onChange={(e) => set("zestimateChangeYears", e.target.value)} placeholder="1" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Climate Risks ── */}
          <Section title="Climate Risks">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Flood Zone" {...ef("floodZone")}>
                <input type="text" value={values.floodZone} onChange={(e) => set("floodZone", e.target.value)} placeholder="e.g. AE, X" className={inputCls} />
              </Field>
              <Field label="Flood Zone Description" {...ef("floodZoneDescription")}>
                <input type="text" value={values.floodZoneDescription} onChange={(e) => set("floodZoneDescription", e.target.value)} placeholder="e.g. Moderate Risk" className={inputCls} />
              </Field>
              <Field label="Fire Risk" {...ef("fireRisk")}>
                <select value={values.fireRisk} onChange={(e) => set("fireRisk", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="minimal">Minimal</option>
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </Field>
              <Field label="Wind Risk" {...ef("windRisk")}>
                <select value={values.windRisk} onChange={(e) => set("windRisk", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="minimal">Minimal</option>
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </Field>
              <Field label="Air Quality Risk" {...ef("airQualityRisk")}>
                <select value={values.airQualityRisk} onChange={(e) => set("airQualityRisk", e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="minimal">Minimal</option>
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </Field>
              <Field label="First Street URL" {...ef("firstStreetUrl")}>
                <input type="url" value={values.firstStreetUrl} onChange={(e) => set("firstStreetUrl", e.target.value)} placeholder="https://riskfactor.com/..." className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* ── Getting Around ── */}
          <Section title="Getting Around">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Walk Score (0–100)" {...ef("walkScore")}>
                <input type="number" min="0" max="100" value={values.walkScore} onChange={(e) => set("walkScore", e.target.value)} placeholder="0–100" className={inputCls} />
              </Field>
              <Field label="Walk Score Description" {...ef("walkScoreDescription")}>
                <input type="text" value={values.walkScoreDescription} onChange={(e) => set("walkScoreDescription", e.target.value)} placeholder="e.g. Very Walkable" className={inputCls} />
              </Field>
              <div />
              <Field label="Bike Score (0–100)" {...ef("bikeScore")}>
                <input type="number" min="0" max="100" value={values.bikeScore} onChange={(e) => set("bikeScore", e.target.value)} placeholder="0–100" className={inputCls} />
              </Field>
              <Field label="Bike Score Description" {...ef("bikeScoreDescription")}>
                <input type="text" value={values.bikeScoreDescription} onChange={(e) => set("bikeScoreDescription", e.target.value)} placeholder="e.g. Bikeable" className={inputCls} />
              </Field>
              <div />
              <Field label="Transit Score (0–100)" {...ef("transitScore")}>
                <input type="number" min="0" max="100" value={values.transitScore} onChange={(e) => set("transitScore", e.target.value)} placeholder="0–100" className={inputCls} />
              </Field>
              <Field label="Transit Score Description" {...ef("transitScoreDescription")}>
                <input type="text" value={values.transitScoreDescription} onChange={(e) => set("transitScoreDescription", e.target.value)} placeholder="e.g. Excellent Transit" className={inputCls} />
              </Field>
            </div>
          </Section>
        </>
      )}

      {/* ── Manager Info ── */}
      <Section title="Property Manager">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Manager Name" {...ef("managerName")}>
            <input type="text" value={values.managerName} onChange={(e) => set("managerName", e.target.value)} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Manager Role" {...ef("managerRole")}>
            <input type="text" value={values.managerRole} onChange={(e) => set("managerRole", e.target.value)} placeholder="e.g. Property Manager" className={inputCls} />
          </Field>
          <Field label="Manager Phone" {...ef("managerPhone")}>
            <input type="text" value={values.managerPhone} onChange={(e) => set("managerPhone", e.target.value)} placeholder="+1 (555) 000-0000" className={inputCls} />
          </Field>
        </div>
        <Field label="Manager Photo">
          <input ref={managerPhotoRef} type="file" accept="image/*"
            onChange={(e) => setManagerPhotoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-gray-800" />
          {managerPhotoFile && <p className="mt-1 text-xs text-gray-500">Selected: {managerPhotoFile.name}</p>}
        </Field>
      </Section>

      {/* ── Current Images (independent — delete is instant via API) ── */}
      {mode === "edit" && (
        <Section title="Current Images">
          {currentImages.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {currentImages.map((url) => (
                <div key={url} className="group relative overflow-hidden rounded-lg">
                  <img src={url} alt="Property" className="h-20 w-full object-cover" />
                  <button type="button" onClick={() => handleRemoveExistingImage(url)}
                    disabled={removingImage === url}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    {removingImage === url
                      ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">Hover an image and click the trash icon to remove it immediately (independent of Save Changes).</p>
        </Section>
      )}

      {/* ── Add New Images (independent upload box with its own checkbox) ── */}
      <Section title={mode === "create" ? "Property Images" : "Add New Images"}>
        {/* Checkbox to include/exclude new uploads from the PATCH (edit mode only) */}
        {mode === "edit" && (
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={newImagesEnabled}
              onChange={() => setNewImagesEnabled((p) => !p)}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-black"
            />
            Include new uploads in this update
          </label>
        )}
        <div className={mode === "edit" && !newImagesEnabled ? "pointer-events-none select-none opacity-40" : ""}>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-gray-800" />
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {images.map((file, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-full object-cover" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {mode === "edit" && (
          <p className="mt-2 text-xs text-gray-400">New images are appended to existing ones — they don't replace them.</p>
        )}
      </Section>

      {/* ── Visibility ── */}
      <Section title="Visibility">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Active (visible to users)" checked={values.isActive} onChange={(v) => set("isActive", v)} {...te("isActive")} />
          <Toggle label="Featured (highlighted on homepage)" checked={values.isFeatured} onChange={(v) => set("isFeatured", v)} activeColor="bg-yellow-400" {...te("isFeatured")} />
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
        <button type="submit" disabled={saving}
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Saving..." : mode === "create" ? "Create Property" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/properties")}
          className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-800">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  fieldKey,
  enabled,
  onToggle,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  fieldKey?: keyof PropertyFormValues;
  enabled?: boolean;
  onToggle?: () => void;
}) {
  const hasCheckbox = fieldKey !== undefined && onToggle !== undefined;
  const isDisabled = hasCheckbox && enabled === false;
  return (
    <div className={isDisabled ? "opacity-40" : ""}>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
        {hasCheckbox && (
          <input
            type="checkbox"
            checked={enabled ?? true}
            onChange={(e) => { e.stopPropagation(); onToggle?.(); }}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-black"
          />
        )}
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className={isDisabled ? "pointer-events-none select-none" : ""}>
        {children}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  activeColor = "bg-black",
  enableField,
  onEnableToggle,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
  enableField?: boolean;
  onEnableToggle?: () => void;
}) {
  const hasCheckbox = onEnableToggle !== undefined;
  const isDisabled = hasCheckbox && enableField === false;
  return (
    <div className={`flex items-center gap-3 ${isDisabled ? "opacity-40" : ""}`}>
      {hasCheckbox && (
        <input
          type="checkbox"
          checked={enableField ?? true}
          onChange={onEnableToggle}
          className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-black"
        />
      )}
      <div
        className={`flex cursor-pointer items-center gap-3 ${isDisabled ? "pointer-events-none select-none" : ""}`}
        onClick={() => !isDisabled && onChange(!checked)}
      >
        <div className={`relative h-6 w-11 rounded-full transition-colors ${checked ? activeColor : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
        </div>
        <span className="select-none text-sm font-medium text-gray-700">{label}</span>
      </div>
    </div>
  );
}
