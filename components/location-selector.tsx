"use client";

import { useLanguage } from "@/lib/language-context";
import {
  formatDistrictDisplay,
  getDistrictByCode,
  getDistrictsByProvince,
  getProvinceByCode,
  searchDistricts,
  THAILAND_LOCATIONS,
} from "@/lib/thailand-locations";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LocationSelectorProps {
  value: string; // District code (e.g., "BKK-01")
  onChange: (districtCode: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Location Selector Component
 * 
 * Features:
 * - Default English display for all users
 * - Backend supports Thai for moderator analytics
 * - Fuzzy search/autocomplete to minimize duplicates
 * - Hierarchical dropdown (Region → Province → District)
 * - Scalable and easy to update
 * 
 * Usage:
 * ```tsx
 * <LocationSelector
 *   value={area}
 *   onChange={setArea}
 *   placeholder="Select teaching location"
 *   required
 * />
 * ```
 */
export function LocationSelector({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
}: LocationSelectorProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>(""); // Province code
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current district for display
  const currentDistrict = useMemo(() => {
    if (!value) return null;
    return getDistrictByCode(value);
  }, [value]);

  // Get filtered districts based on search and province selection
  const filteredDistricts = useMemo(() => {
    if (searchQuery.trim()) {
      // Search mode: show matching districts from all provinces
      return searchDistricts(searchQuery).slice(0, 20); // Limit to 20 results
    }

    if (selectedProvince) {
      // Province selected: show all districts in that province
      return getDistrictsByProvince(selectedProvince);
    }

    // No search, no province: show top 10 most common districts (Bangkok)
    const bangkokProvince = getProvinceByCode("BKK");
    return bangkokProvince?.districts.slice(0, 10) || [];
  }, [searchQuery, selectedProvince]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectDistrict = (districtCode: string) => {
    onChange(districtCode);
    setIsOpen(false);
    setSearchQuery("");
    setSelectedProvince("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchQuery("");
    setSelectedProvince("");
  };

  const displayValue = currentDistrict
    ? formatDistrictDisplay(value)
    : placeholder || t("Select location", "เลือกสถานที่");

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-white
          border-gray-300 dark:border-gray-600
          focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between gap-2
          ${!currentDistrict ? "text-gray-500 dark:text-gray-400" : ""}
        `}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{displayValue}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {currentDistrict && !disabled && (
            <X
              className="w-4 h-4 hover:text-red-500"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-[400px] overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedProvince(""); // Clear province when searching
                }}
                placeholder={t("Search districts...", "ค้นหาเขต...")}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Province Selector (shown when not searching) */}
          {!searchQuery && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {t("All Provinces (showing Bangkok)", "ทุกจังหวัด (แสดงกรุงเทพฯ)")}
                </option>
                {THAILAND_LOCATIONS.map((region) => (
                  <optgroup key={region.code} label={region.nameEn}>
                    {region.provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.nameEn} ({province.nameTh})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* Districts List */}
          <div className="overflow-y-auto flex-1">
            {filteredDistricts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t("No districts found", "ไม่พบเขต")}
              </div>
            ) : (
              <div className="py-1">
                {filteredDistricts.map((district) => {
                  // Get province context for display
                  let provinceContext = "";
                  for (const region of THAILAND_LOCATIONS) {
                    for (const province of region.provinces) {
                      if (province.districts.some(d => d.code === district.code)) {
                        provinceContext = province.nameEn;
                        break;
                      }
                    }
                    if (provinceContext) break;
                  }

                  return (
                    <button
                      key={district.code}
                      type="button"
                      onClick={() => handleSelectDistrict(district.code)}
                      className={`
                        w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                        ${value === district.code ? "bg-blue-50 dark:bg-blue-900" : ""}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {district.nameEn}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {provinceContext} • {district.nameTh}
                          </div>
                        </div>
                        {value === district.code && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Footer */}
          {searchQuery && filteredDistricts.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
              {t(
                `Showing ${filteredDistricts.length} result${filteredDistricts.length === 1 ? "" : "s"}`,
                `แสดง ${filteredDistricts.length} ผลลัพธ์`
              )}
            </div>
          )}
        </div>
      )}

      {/* Required indicator */}
      {required && !currentDistrict && (
        <p className="mt-1 text-xs text-red-500">
          {t("Location is required", "ต้องระบุสถานที่")}
        </p>
      )}
    </div>
  );
}
