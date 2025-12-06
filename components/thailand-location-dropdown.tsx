"use client";

import { useLanguage } from "@/lib/language-context";
import {
  getAllProvinces,
  getDistrictsByProvince,
  searchDistricts,
  searchProvinces,
  type ThailandDistrict,
  type ThailandProvince,
} from "@/lib/thailand-locations";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface ThailandLocationDropdownProps {
  /** Selected province code */
  provinceCode: string;
  /** Selected district name (English) */
  districtName: string;
  /** Callback when province changes */
  onProvinceChange: (provinceCode: string, provinceName: string) => void;
  /** Callback when district changes */
  onDistrictChange: (districtName: string) => void;
  /** Whether the fields are required */
  required?: boolean;
  /** Whether to show labels */
  showLabels?: boolean;
  /** Whether fields are disabled */
  disabled?: boolean;
  /** Custom CSS class for container */
  className?: string;
}

/**
 * Thailand Location Dropdown Component
 * 
 * Features:
 * - Cascading dropdowns (Province → District)
 * - Search/autocomplete for both fields
 * - Fuzzy matching support
 * - Bilingual display (English default, Thai supported)
 * - Keyboard navigation
 * - Accessible (ARIA labels, keyboard support)
 * 
 * Usage:
 * ```tsx
 * <ThailandLocationDropdown
 *   provinceCode={provinceCode}
 *   districtName={districtName}
 *   onProvinceChange={(code, name) => setProvinceCode(code)}
 *   onDistrictChange={(name) => setDistrictName(name)}
 *   required
 * />
 * ```
 */
export function ThailandLocationDropdown({
  provinceCode,
  districtName,
  onProvinceChange,
  onDistrictChange,
  required = false,
  showLabels = true,
  disabled = false,
  className = "",
}: ThailandLocationDropdownProps) {
  const { t, language } = useLanguage();

  // Local state
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [highlightedProvinceIndex, setHighlightedProvinceIndex] = useState(0);
  const [highlightedDistrictIndex, setHighlightedDistrictIndex] = useState(0);

  // Refs for click-outside detection
  const provinceRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const provinceInputRef = useRef<HTMLInputElement>(null);
  const districtInputRef = useRef<HTMLInputElement>(null);

  // Get all provinces
  const allProvinces = useMemo(() => getAllProvinces(), []);

  // Get selected province details
  const selectedProvince = useMemo(
    () => allProvinces.find((p) => p.code === provinceCode),
    [allProvinces, provinceCode]
  );

  // Filter provinces based on search
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return allProvinces;
    return searchProvinces(provinceSearch);
  }, [provinceSearch, allProvinces]);

  // Get districts for selected province
  const availableDistricts = useMemo(() => {
    if (!provinceCode) return [];
    return getDistrictsByProvince(provinceCode);
  }, [provinceCode]);

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    if (!provinceCode) return [];
    if (!districtSearch.trim()) return availableDistricts;
    return searchDistricts(provinceCode, districtSearch);
  }, [provinceCode, districtSearch, availableDistricts]);

  // Get display value for province
  const provinceDisplayValue = useMemo(() => {
    if (!selectedProvince) return "";
    // Always show English for user-facing dropdowns
    // Thai is available for moderator analytics descriptions only
    return selectedProvince.nameEn;
  }, [selectedProvince]);

  // Handle province selection
  const handleProvinceSelect = (province: ThailandProvince) => {
    onProvinceChange(province.code, province.nameEn);
    setProvinceSearch("");
    setShowProvinceDropdown(false);
    setHighlightedProvinceIndex(0);
    
    // Clear district when province changes
    if (districtName) {
      onDistrictChange("");
      setDistrictSearch("");
    }

    // Focus district input after province selection
    setTimeout(() => districtInputRef.current?.focus(), 100);
  };

  // Handle district selection
  const handleDistrictSelect = (district: ThailandDistrict) => {
    onDistrictChange(district.nameEn);
    setDistrictSearch("");
    setShowDistrictDropdown(false);
    setHighlightedDistrictIndex(0);
  };

  // Handle province input focus
  const handleProvinceFocus = () => {
    setShowProvinceDropdown(true);
    setHighlightedProvinceIndex(0);
  };

  // Handle district input focus
  const handleDistrictFocus = () => {
    if (!provinceCode) {
      // Focus province input if no province selected
      provinceInputRef.current?.focus();
      return;
    }
    setShowDistrictDropdown(true);
    setHighlightedDistrictIndex(0);
  };

  // Handle keyboard navigation for provinces
  const handleProvinceKeyDown = (e: React.KeyboardEvent) => {
    if (!showProvinceDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedProvinceIndex((prev) =>
          prev < filteredProvinces.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedProvinceIndex((prev) =>
          prev > 0 ? prev - 1 : filteredProvinces.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredProvinces[highlightedProvinceIndex]) {
          handleProvinceSelect(filteredProvinces[highlightedProvinceIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowProvinceDropdown(false);
        setProvinceSearch("");
        break;
    }
  };

  // Handle keyboard navigation for districts
  const handleDistrictKeyDown = (e: React.KeyboardEvent) => {
    if (!showDistrictDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedDistrictIndex((prev) =>
          prev < filteredDistricts.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedDistrictIndex((prev) =>
          prev > 0 ? prev - 1 : filteredDistricts.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredDistricts[highlightedDistrictIndex]) {
          handleDistrictSelect(filteredDistricts[highlightedDistrictIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDistrictDropdown(false);
        setDistrictSearch("");
        break;
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false);
        setProvinceSearch("");
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictDropdown(false);
        setDistrictSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (showProvinceDropdown) {
      const element = document.getElementById(`province-option-${highlightedProvinceIndex}`);
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedProvinceIndex, showProvinceDropdown]);

  useEffect(() => {
    if (showDistrictDropdown) {
      const element = document.getElementById(`district-option-${highlightedDistrictIndex}`);
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedDistrictIndex, showDistrictDropdown]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Province Dropdown */}
      <div ref={provinceRef} className="relative">
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("Province", "จังหวัด")}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={provinceInputRef}
            type="text"
            value={showProvinceDropdown ? provinceSearch : provinceDisplayValue}
            onChange={(e) => setProvinceSearch(e.target.value)}
            onFocus={handleProvinceFocus}
            onKeyDown={handleProvinceKeyDown}
            disabled={disabled}
            placeholder={t("Search province...", "ค้นหาจังหวัด...")}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Province", "จังหวัด")}
            aria-expanded={showProvinceDropdown}
            aria-controls="province-dropdown"
            autoComplete="off"
          />

          {provinceDisplayValue && !showProvinceDropdown && (
            <button
              type="button"
              onClick={() => {
                onProvinceChange("", "");
                onDistrictChange("");
                setProvinceSearch("");
                provinceInputRef.current?.focus();
              }}
              disabled={disabled}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={t("Clear province", "ล้างจังหวัด")}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
              showProvinceDropdown ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Province Dropdown List */}
        {showProvinceDropdown && (
          <div
            id="province-dropdown"
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredProvinces.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {t("No provinces found", "ไม่พบจังหวัด")}
              </div>
            ) : (
              filteredProvinces.map((province, index) => (
                <div
                  key={province.code}
                  id={`province-option-${index}`}
                  onClick={() => handleProvinceSelect(province)}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === highlightedProvinceIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  } ${
                    province.code === provinceCode
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                  role="option"
                  aria-selected={province.code === provinceCode}
                >
                  <div className="flex items-center justify-between">
                    <span>{province.nameEn}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {province.nameTh}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {province.region} • {province.districts.length} {t("districts", "อำเภอ")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* District Dropdown */}
      <div ref={districtRef} className="relative">
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("District", "อำเภอ")}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={districtInputRef}
            type="text"
            value={showDistrictDropdown ? districtSearch : districtName}
            onChange={(e) => setDistrictSearch(e.target.value)}
            onFocus={handleDistrictFocus}
            onKeyDown={handleDistrictKeyDown}
            disabled={disabled || !provinceCode}
            placeholder={
              !provinceCode
                ? t("Select province first", "เลือกจังหวัดก่อน")
                : t("Search district...", "ค้นหาอำเภอ...")
            }
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("District", "อำเภอ")}
            aria-expanded={showDistrictDropdown}
            aria-controls="district-dropdown"
            autoComplete="off"
          />

          {districtName && !showDistrictDropdown && (
            <button
              type="button"
              onClick={() => {
                onDistrictChange("");
                setDistrictSearch("");
                districtInputRef.current?.focus();
              }}
              disabled={disabled}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={t("Clear district", "ล้างอำเภอ")}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <ChevronDown
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
              showDistrictDropdown ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* District Dropdown List */}
        {showDistrictDropdown && provinceCode && (
          <div
            id="district-dropdown"
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredDistricts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {t("No districts found", "ไม่พบอำเภอ")}
              </div>
            ) : (
              filteredDistricts.map((district, index) => (
                <div
                  key={district.nameEn}
                  id={`district-option-${index}`}
                  onClick={() => handleDistrictSelect(district)}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === highlightedDistrictIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  } ${
                    district.nameEn === districtName
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                  role="option"
                  aria-selected={district.nameEn === districtName}
                >
                  <div className="flex items-center justify-between">
                    <span>{district.nameEn}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {district.nameTh}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
