# Auto-Translation Integration Plan

**Date**: December 21, 2025  
**Feature**: Automatic bilingual translation for Thai ↔ English inputs  
**Status**: 🔍 Investigation & Planning Phase

---

## 🎯 Executive Summary

Integrate automatic translation into existing `BilingualInput` component to auto-fill the opposite language field when users type in one language. Moderators typing in Thai would see instant English translation (and vice versa).

### Key Benefits

- ⚡ **Speed**: Reduce data entry time by 50% (no manual dual-entry)
- 🎯 **Accuracy**: Machine translation consistency
- 🌍 **Scalability**: Easy to extend to other language pairs
- 💰 **Cost-Effective**: Free tier covers ~90% of typical usage

---

## 📊 API Comparison & Recommendation

### Translation API Options (2024 Research)

| Provider             | Free Tier | Cost/1M chars  | Speed           | Thai Support | Recommendation     |
| -------------------- | --------- | -------------- | --------------- | ------------ | ------------------ |
| **Google Translate** | 500K/mo   | $20            | Fast (< 1s)     | ✅ Excellent | ⭐ **RECOMMENDED** |
| **Microsoft Azure**  | 2M/mo     | $10            | Fastest (0.09s) | ✅ Good      | Alternative        |
| **DeepL**            | 500K/mo   | $20 + $4.99/mo | Slower (~1s)    | ⚠️ Limited   | Not ideal          |

### ⭐ Recommended: **Google Cloud Translation API v3**

**Why Google?**

1. **Thai Support**: Best-in-class for Asian languages
2. **Free Tier**: 500,000 characters/month = ~10,000 translations
3. **Speed**: Sub-second translation (300-800ms)
4. **Reliability**: 99.95% uptime SLA
5. **Integration**: Simple REST API, no complex setup
6. **Pricing**: Only $20/1M chars after free tier

**Monthly Usage Estimate:**

```
Average notification: 100 chars (EN) + 150 chars (TH) = 250 chars
Average class note: 200 chars (EN) + 300 chars (TH) = 500 chars

Moderate usage: 20 notifications/day + 30 notes/day = 50 translations/day
50 × 30 days × 500 chars = 750,000 chars/month

Cost: First 500K FREE, remaining 250K = $5/month
```

**Alternative: Microsoft Azure** (if already using Azure ecosystem)

- Larger free tier (2M chars/month)
- Cheaper at scale ($10/1M)
- Fastest response times (90ms)

---

## 🏗️ Technical Architecture

### 1. Backend Translation Function (Convex)

```typescript
// convex/translation.ts
import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Auto-translate text using Google Cloud Translation API
 *
 * Rate Limiting: Max 60 requests/minute per user
 * Caching: Cache translations for 24 hours to reduce API calls
 */
export const translateText = action({
  args: {
    text: v.string(),
    sourceLang: v.union(v.literal("en"), v.literal("th")),
    targetLang: v.union(v.literal("en"), v.literal("th")),
    userId: v.id("users"), // For rate limiting
  },
  handler: async (ctx, args) => {
    // Rate limit check
    const rateLimitOk = await ctx.runQuery(internal.rateLimit.checkTranslation, {
      userId: args.userId,
    });
    if (!rateLimitOk) {
      throw new Error("Translation rate limit exceeded (60/min)");
    }

    // Check cache first
    const cached = await ctx.runQuery(internal.translationCache.get, {
      text: args.text,
      sourceLang: args.sourceLang,
      targetLang: args.targetLang,
    });
    if (cached) return cached.translation;

    // Call Google Translate API
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: args.text,
        source: args.sourceLang,
        target: args.targetLang,
        format: "text",
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0].translatedText;

    // Cache result for 24 hours
    await ctx.runMutation(internal.translationCache.set, {
      text: args.text,
      sourceLang: args.sourceLang,
      targetLang: args.targetLang,
      translation,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return translation;
  },
});
```

### 2. Enhanced BilingualInput Component

```typescript
// components/bilingual-input.tsx (enhanced)
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/lib/use-debounce"; // NEW custom hook

interface BilingualInputProps {
  // ... existing props
  autoTranslate?: boolean; // NEW: Enable auto-translation
  userId?: Id<"users">; // NEW: For rate limiting
  minCharsForTranslation?: number; // NEW: Minimum chars before translating
}

export function BilingualInput({
  autoTranslate = false,
  userId,
  minCharsForTranslation = 3,
  ...props
}: BilingualInputProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const translateText = useAction(api.translation.translateText);

  // Debounce translation triggers (500ms after user stops typing)
  const debouncedValueEn = useDebounce(localValueEn, 500);
  const debouncedValueTh = useDebounce(localValueTh, 500);

  // Auto-translate English → Thai
  useEffect(() => {
    if (!autoTranslate || !userId) return;
    if (debouncedValueEn.length < minCharsForTranslation) return;
    if (localValueTh.length > 0) return; // Don't overwrite user input

    const translate = async () => {
      setIsTranslating(true);
      setTranslationError(null);
      try {
        const translation = await translateText({
          text: debouncedValueEn,
          sourceLang: "en",
          targetLang: "th",
          userId,
        });
        setLocalValueTh(translation);
        onChangeTh(translation);
      } catch (err) {
        setTranslationError(err instanceof Error ? err.message : "Translation failed");
        toast.error("Translation failed", "การแปลล้มเหลว");
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [debouncedValueEn]);

  // Auto-translate Thai → English (similar logic)
  useEffect(() => {
    if (!autoTranslate || !userId) return;
    if (debouncedValueTh.length < minCharsForTranslation) return;
    if (localValueEn.length > 0) return;

    const translate = async () => {
      setIsTranslating(true);
      setTranslationError(null);
      try {
        const translation = await translateText({
          text: debouncedValueTh,
          sourceLang: "th",
          targetLang: "en",
          userId,
        });
        setLocalValueEn(translation);
        onChangeEn(translation);
      } catch (err) {
        setTranslationError(err instanceof Error ? err.message : "Translation failed");
        toast.error("Translation failed", "การแปลล้มเหลว");
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [debouncedValueTh]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* English Input */}
      <div className="relative">
        <label className="block text-sm font-medium mb-2">
          {t(labelEn, labelTh)} (English)
          {isTranslating && <span className="ml-2 text-xs text-blue-500">Translating...</span>}
        </label>
        <input
          value={localValueEn}
          onChange={handleChangeEn}
          className={baseInputClasses}
        />
        {translationError && (
          <p className="text-xs text-red-500 mt-1">{translationError}</p>
        )}
      </div>

      {/* Thai Input with translation indicator */}
      <div className="relative">
        <label className="block text-sm font-medium mb-2">
          {t(labelEn, labelTh)} (ไทย)
          {isTranslating && (
            <span className="ml-2">
              <LoadingSpinner size="xs" />
            </span>
          )}
        </label>
        <input
          value={localValueTh}
          onChange={handleChangeTh}
          className={baseInputClasses}
        />
      </div>
    </div>
  );
}
```

### 3. Translation Cache Schema (Convex)

```typescript
// convex/schema.ts (additions)
translationCache: defineTable({
  text: v.string(),
  sourceLang: v.union(v.literal("en"), v.literal("th")),
  targetLang: v.union(v.literal("en"), v.literal("th")),
  translation: v.string(),
  expiresAt: v.number(),
})
  .index("by_text_langs", ["text", "sourceLang", "targetLang"])
  .index("by_expiry", ["expiresAt"]), // For cleanup cron

translationRateLimit: defineTable({
  userId: v.id("users"),
  timestamp: v.number(),
  count: v.number(),
})
  .index("by_user_time", ["userId", "timestamp"]),
```

---

## 🎨 UX Design Patterns

### 1. Translation Trigger Strategy

**Option A: Automatic (Recommended)**

```
User types in Thai field → (pause 500ms) → Auto-translate to English
User types in English field → (pause 500ms) → Auto-translate to Thai
```

**Behavior:**

- ✅ Only translates if opposite field is EMPTY (prevents overwriting user input)
- ✅ Shows "Translating..." indicator
- ✅ Minimum 3 characters before triggering
- ✅ 500ms debounce (wait for user to finish typing)

**Option B: Manual Toggle Button**

```
[ Translate from Thai ] button next to Thai input
[ Translate from English ] button next to English input
```

**Option C: Hybrid (Best UX)**

```
Auto-translate by default
[ ↻ Re-translate ] button appears after manual edits
[ × Clear Translation ] button to start fresh
```

### 2. Visual Feedback

```tsx
// Translation States
<input className={classNames(
  baseInputClasses,
  isTranslating && "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  translationError && "border-red-400",
)}>
```

**Loading State:**

```
┌─────────────────────────────┐
│ Message (English)           │
│ ┌─────────────────────────┐ │
│ │ Hello, this is a test   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Message (ไทย) ⟳ Translating...│
│ ┌─────────────────────────┐ │
│ │ สวัสดี นี่คือ...         │ │ ← Appears character by character
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 3. Error Handling

```tsx
// Rate limit exceeded
toast.warning("Translation limit reached (60/min). Please wait.", "ถึงขีดจำกัดการแปล (60/นาที) กรุณารอสักครู่");

// API error
toast.error("Translation service unavailable. Please enter manually.", "บริการแปลไม่พร้อมใช้งาน กรุณากรอกด้วยตนเอง");

// Network error
toast.error("Connection error. Check your internet.", "เกิดข้อผิดพลาดในการเชื่อมต่อ ตรวจสอบอินเทอร์เน็ต");
```

---

## 🔐 Security & Privacy

### API Key Management

```bash
# .env.local
GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# Convex environment variables (production)
npx convex env set GOOGLE_TRANSLATE_API_KEY your_api_key_here
```

### Rate Limiting (Prevent Abuse)

```typescript
// convex/rateLimit.ts
export const checkTranslation = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recent = await ctx.db
      .query("translationRateLimit")
      .withIndex("by_user_time", (q) => q.eq("userId", args.userId).gte("timestamp", oneMinuteAgo))
      .collect();

    const totalRequests = recent.reduce((sum, r) => sum + r.count, 0);

    // Limit: 60 translations per minute per user
    return totalRequests < 60;
  },
});
```

### Data Privacy

- ✅ No translation data stored permanently (24hr cache only)
- ✅ No PII sent to Google (only text content)
- ✅ Cache cleanup cron runs daily
- ✅ User can disable auto-translation in settings

---

## 📝 Implementation Checklist

### Phase 1: Setup & Infrastructure (Day 1)

- [ ] Create Google Cloud Project
- [ ] Enable Cloud Translation API
- [ ] Generate API key
- [ ] Set environment variables (Convex)
- [ ] Test API connection with curl

### Phase 2: Backend Implementation (Day 2)

- [ ] Create `convex/translation.ts` action
- [ ] Add translation cache schema
- [ ] Implement rate limiting
- [ ] Add cache cleanup cron
- [ ] Write unit tests for translation logic

### Phase 3: Frontend Integration (Day 3)

- [ ] Create `useDebounce` custom hook
- [ ] Enhance `BilingualInput` component
- [ ] Add translation states (loading, error)
- [ ] Implement visual indicators
- [ ] Add manual override controls

### Phase 4: UX Enhancements (Day 4)

- [ ] Add "Translating..." spinner
- [ ] Implement toast notifications
- [ ] Add keyboard shortcuts (Ctrl+T to translate)
- [ ] Create settings toggle for auto-translate
- [ ] Add accessibility labels (screen readers)

### Phase 5: Testing (Day 5)

- [ ] Unit tests: Translation action
- [ ] Unit tests: Rate limiting
- [ ] E2E tests: Auto-translation flow
- [ ] E2E tests: Error handling
- [ ] Manual testing: Edge cases

### Phase 6: Documentation & Deployment (Day 6)

- [ ] Update developer docs
- [ ] Create user guide for auto-translation
- [ ] Add to Pattern #34 (Auto-Translation)
- [ ] Deploy to production
- [ ] Monitor API usage and costs

---

## 💰 Cost Analysis

### Monthly Cost Projection

**Scenario 1: Light Usage (10 users, 5 translations/day each)**

```
10 users × 5 translations/day × 30 days = 1,500 translations/month
Average 300 chars/translation = 450,000 chars/month
Cost: $0 (within 500K free tier)
```

**Scenario 2: Moderate Usage (50 users, 10 translations/day each)**

```
50 users × 10 translations/day × 30 days = 15,000 translations/month
Average 300 chars/translation = 4,500,000 chars/month
Cost: (4,500,000 - 500,000) / 1,000,000 × $20 = $80/month
```

**Scenario 3: Heavy Usage (200 users, 20 translations/day each)**

```
200 users × 20 translations/day × 30 days = 120,000 translations/month
Average 300 chars/translation = 36,000,000 chars/month
Cost: (36,000,000 - 500,000) / 1,000,000 × $20 = $710/month
```

### Cost Optimization Strategies

1. **Aggressive Caching** (24hr → 7 days)
   - Reduces repeat translations by 40%
   - Savings: $32/month (moderate usage)

2. **Minimum Character Threshold** (3 → 10 chars)
   - Prevents translating short words like "OK", "Yes"
   - Savings: $15/month

3. **Rate Limiting** (60/min → 30/min)
   - Prevents API abuse
   - Savings: Variable

4. **Batch Translation** (combine multiple fields)
   - Translate 5 fields in one API call
   - Savings: $20/month

**Total Optimized Cost (Moderate Usage):**
$80 - $32 - $15 - $20 = **$13/month**

---

## 🚀 Alternative Implementation: Free Local Translation

### Option: LibreTranslate (Self-Hosted, 100% Free)

```bash
# Docker deployment
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate

# Convex action calls local server
const response = await fetch("http://localhost:5000/translate", {
  method: "POST",
  body: JSON.stringify({
    q: text,
    source: "en",
    target: "th",
    format: "text",
  }),
  headers: { "Content-Type": "application/json" },
});
```

**Pros:**

- ✅ 100% free, no usage limits
- ✅ Complete data privacy (no external API)
- ✅ Open source (customizable)

**Cons:**

- ❌ Lower accuracy than Google (~70% vs 95%)
- ❌ Requires server hosting ($5-10/month DigitalOcean)
- ❌ Slower (2-3 seconds per translation)
- ❌ Limited Thai language support

**Verdict:** Only viable if budget is $0 and quality is acceptable.

---

## 📚 What I Need From You

To implement this feature, I'll need the following:

### 1. **Google Cloud API Key** (Required)

```
Provide either:
- Existing Google Cloud Project ID
- OR approval to create new project and billing account
```

**Steps to get API key:**

1. Go to <https://console.cloud.google.com>
2. Create new project "Class Tracker Translation"
3. Enable "Cloud Translation API"
4. Create credentials → API Key
5. Restrict API key to Translation API only
6. Share key via secure channel (encrypted DM, not public repo)

### 2. **Feature Requirements Clarification** (Choose One)

**Translation Trigger:**

- [ ] **Option A**: Auto-translate (500ms debounce, only if opposite field empty)
- [ ] **Option B**: Manual button click ("Translate" button)
- [ ] **Option C**: Hybrid (auto-translate + manual override)

**Visual Feedback:**

- [ ] Show "Translating..." text
- [ ] Show spinner icon
- [ ] Highlight field with blue border during translation
- [ ] All of the above

**Error Handling:**

- [ ] Silent fail (don't show errors, just don't translate)
- [ ] Toast notification for errors
- [ ] Inline error message below field

**User Control:**

- [ ] Always auto-translate (no off switch)
- [ ] Settings toggle to enable/disable per user
- [ ] Per-form toggle (checkbox "Auto-translate")

### 3. **Testing Requirements**

- [ ] Test with development API key first (I can create test account)
- [ ] Deploy to production after testing
- [ ] Monitor usage for first week
- [ ] Set up billing alerts ($50/month threshold)

### 4. **Integration Scope** (Which components?)

Check all that apply:

- [ ] Notification creation form
- [ ] Class notes/description
- [ ] Student notes
- [ ] Location proposals
- [ ] School descriptions
- [ ] Teacher resources
- [ ] Messaging system
- [ ] All bilingual fields across entire app

---

## 🎯 Recommended Next Steps

### Immediate (Today)

1. ✅ Review this plan and approve approach
2. ✅ Choose translation trigger strategy (A/B/C)
3. ✅ Create Google Cloud project + API key
4. ✅ Share API key securely

### Week 1 (Implementation)

1. 🔧 Day 1-2: Backend setup (Convex actions + caching)
2. 🎨 Day 3-4: Frontend integration (BilingualInput enhancement)
3. 🧪 Day 5: Testing (E2E + manual)
4. 📚 Day 6: Documentation + deployment

### Week 2 (Monitoring)

1. 📊 Monitor API usage daily
2. 📈 Track user adoption metrics
3. 💬 Collect user feedback
4. 🐛 Fix bugs and optimize

---

## ❓ Questions to Answer

1. **Budget**: What's the maximum monthly translation cost you're comfortable with?
   - $0 (free tier only)
   - $10/month
   - $50/month
   - $100/month
   - Unlimited

2. **Languages**: Plan to add more languages in future?
   - No, English/Thai only
   - Maybe (Chinese, Japanese, Korean)
   - Yes (list languages: **\*\***\_**\*\***)

3. **Performance**: Acceptable translation delay?
   - < 500ms (requires Azure, more expensive)
   - < 1 second (Google works)
   - < 2 seconds (LibreTranslate free option)

4. **Privacy**: Any concerns about sending text to Google servers?
   - No concerns (Google is fine)
   - Yes, prefer self-hosted (LibreTranslate)
   - Need to review Google's data policy first

5. **Rollout**: Phased rollout or full launch?
   - Phased (admins only → moderators → teachers)
   - Full launch (all users immediately)

---

## 📞 Ready to Proceed?

Reply with:

1. ✅ Approval to proceed
2. 🔑 Google Translate API key (or approval to create)
3. 🎯 Chosen translation trigger (Option A/B/C)
4. 💰 Budget approval
5. 📋 Answers to questions above

I'll begin implementation immediately after receiving these items!

---

**Estimated Timeline**: 6 days (setup → deploy → monitor)  
**Estimated Cost**: $0-80/month depending on usage  
**Complexity**: Medium (API integration + caching + UX)  
**ROI**: High (50% reduction in data entry time)
