# Thailand Location Data - Maintenance Guide

**Last Updated:** August 22, 2026  
**Version:** 2.0.0

## Overview

This guide provides instructions for maintaining and updating the Thailand province and district data used in the Class Tracker application.

## Current Data Coverage

### Complete National Coverage (77 provinces)

All 77 provinces are now fully populated (76 provinces from the national amphoe list plus Bangkok's 50 khets):

**Total:** 928 districts across 77 provinces

- 878 amphoe across the 76 provinces (per Wikipedia "List of districts of Thailand", DOPA-referenced, as of 2018-12-31)
- 50 khets (districts) of Bangkok (per Wikipedia "List of districts of Bangkok")

Every province carries a unique code, EN/TH names, a region assignment (`Central` | `North` | `Northeast` | `East` | `West` | `South`), and every entry has a precomputed `searchKey` built via `normalizeForSearch()`.

### v2.0.0 Data Corrections (2026-08-22)

During the full-population pass, the existing 15 provinces were cross-validated row-by-row against the source lists. Corrections applied:

- **Ubon Ratchathani:** duplicate "Tan Sum"/'ตาลสุม' row corrected to the missing district **Nam Khun**/'น้ำขุ่น'; mispaired rows fixed so all 25 districts match the official list (Khong Chiam, Khueang Nai, Na Yia restored)
- **Chiang Rai:** incorrect 'โป่ง' entry corrected to **Chiang Saen**/'เชียงแสน'
- **Khon Kaen:** corrected to **Khok Pho Chai**/'โคกโพธิ์ไชย' and **Wiang Kao**/'เวียงเก่า'
- **Chonburi:** Thai typo fixed (**Ko Chan**/'เกาะจันทร์')
- **Surat Thani:** Thai typos fixed (**Ko Pha-ngan**/'เกาะพะงัน', **Tha Chang**/'ท่าฉาง')
- **Tak:** EN romanization aligned with source (**Umphang**)

Known intentional deviation: Rat Burana (Bangkok) keeps the Royal Institute spelling 'ราษฎร์บูรณะ'; the Wikipedia khet table contains a minor variant ('ราษฏร์บูรณะ').

### Source of Truth

- Wikipedia: [List of districts of Thailand](https://en.wikipedia.org/wiki/List_of_districts_of_Thailand) — 878 amphoe table, referenced to Thailand's Department of Provincial Administration (DOPA). Note this figure excludes Bangkok.
- Wikipedia: [List of districts of Bangkok](https://en.wikipedia.org/wiki/List_of_districts_of_Bangkok) — 50 khets.

### Adding New Province Data

See full guide in the file for step-by-step instructions on:

- Finding official data sources
- Adding province/district data
- Testing changes
- Troubleshooting common issues

## File Structure

- `lib/thailand-locations.ts` - Main data file (~5,500 lines, 77 provinces / 928 districts)
- `components/thailand-location-dropdown.tsx` - Dropdown component (566 lines)
- `convex/schema.ts` - Database schema with location fields
- `convex/students.ts` - Backend mutations

## API Reference

Key utility functions available:

- `getAllProvinces()` - Get all provinces
- `searchProvinces(term)` - Fuzzy search provinces
- `getDistrictsByProvince(code)` - Get districts by province
- `searchDistricts(code, term)` - Fuzzy search districts
- `formatLocation(code, district, lang)` - Format for display

For complete documentation and maintenance procedures, see this file.
