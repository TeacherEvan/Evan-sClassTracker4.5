# User Notes: Monthly Calendar Implementation

**Date**: November 10, 2025

## Implementation Requirements (From User Notes)

### Core Changes

1. **Change from Weekly to Monthly Calendar**
   - Replace 7-day view with full month view (28-31 days)
   - Keep all existing functionality (booking, modals, filters)
   - Maintain mobile responsiveness

### Grid Layout

- Use 7 columns × 5-6 rows (35-42 cells)
- Show padding days from previous/next month (grayed out)
- Highlight current day with blue ring
- Month navigation (Previous/Next buttons)

### Date Range

- Display full calendar month
- Include buffer days from adjacent months for complete weeks
- Month header shows: "Month Year" (e.g., "November 2025")

### Mobile Considerations

- Smaller cells on mobile (80px min-height)
- Touch-friendly buttons (48px minimum)
- Swipe gestures for month navigation
- Compact item display with "+X more" for overflow

### Performance

- Limit visible items per cell (max 3)
- Query optimization for month range
- Avoid rendering all classes upfront
- Consider virtualization for large datasets

### Accessibility

- ARIA grid pattern with keyboard navigation
- Arrow keys for cell navigation
- Page Up/Down for month navigation
- Screen reader labels
- Focus indicators

### Testing

- Update E2E tests to check for "Monthly Calendar" instead of "Weekly Calendar"
- Test mobile responsiveness
- Test keyboard navigation
- Verify performance with heavy load (100+ classes)

### Timeline Estimate

- Date utilities: 20 min
- Component refactor: 60 min
- Grid layout: 45 min
- Mobile optimization: 30 min
- Bilingual updates: 15 min
- App integration: 10 min
- Test updates: 20 min
- Performance testing: 15 min
- **Total: ~3.5 hours**

## User Approval Status

✅ **APPROVED** - Proceed with implementation

## Implementation Order

1. Create date utility functions first
2. Refactor component state and queries
3. Rebuild grid layout with ARIA support
4. Optimize for mobile
5. Update bilingual strings
6. Integrate into app
7. Fix E2E tests
8. Performance verification

## Notes

- Keep existing features (swipe, booking, modals)
- Follow Material Design 3 patterns
- WCAG 2.1 AA compliance required
- Test on Chrome, Firefox, Safari, Edge
- Mobile testing on iOS Safari and Android Chrome
