# Thailand Location Data - Maintenance Guide

**Last Updated:** December 6, 2025  
**Version:** 1.0.0

## Overview

This guide provides instructions for maintaining and updating the Thailand province and district data used in the Class Tracker application.

## Current Data Coverage

### Fully Populated Provinces (15)

- Bangkok (BKK): 50 districts
- Chiang Mai (CNX): 25 districts  
- Chiang Rai (CRI): 18 districts
- And 12 more provinces...

**Total:** ~400 districts across 15 provinces

### Adding New Province Data

See full guide in the file for step-by-step instructions on:

- Finding official data sources
- Adding province/district data
- Testing changes
- Troubleshooting common issues

## File Structure

- `lib/thailand-locations.ts` - Main data file (1,013 lines)
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
