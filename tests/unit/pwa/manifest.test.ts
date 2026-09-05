import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("PWA manifest", () => {
  const manifestPath = resolve(process.cwd(), "public/manifest.webmanifest");
  const raw = readFileSync(manifestPath, "utf8");
  const m = JSON.parse(raw) as Record<string, unknown> & {
    icons?: Array<{ src: string; sizes?: string; type?: string }>;
  };

  it("AC-1 has required fields", () => {
    expect(typeof m.name).toBe("string");
    expect((m.name as string).length).toBeGreaterThan(0);
    expect(typeof m.short_name).toBe("string");
    expect((m.short_name as string).length).toBeGreaterThan(0);
    expect(typeof m.start_url).toBe("string");
    expect(m.start_url as string).toMatch(/^\//);
    expect(m.display).toBe("standalone");
    expect(typeof m.background_color).toBe("string");
    expect(typeof m.theme_color).toBe("string");
  });

  it("AC-1 declares at least one icon with sizes + type", () => {
    expect(Array.isArray(m.icons)).toBe(true);
    expect((m.icons ?? []).length).toBeGreaterThan(0);
    const icon = (m.icons as Array<{ src: string; sizes?: string; type?: string }>)[0];
    expect(icon.src).toMatch(/^\//);
    expect(icon.sizes ?? "").toMatch(/^\d+x\d+$/);
    expect(icon.type ?? "").toMatch(/^image\//);
  });

  it("AC-2 root layout wires the manifest via Next metadata API + apple-touch-icon", () => {
    const layout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
    // Next 15 App Router renders <link rel="manifest"> + apple-touch-icon from metadata.
    // The source must declare both via the metadata API.
    expect(layout).toMatch(/manifest:\s*["']\/manifest\.webmanifest["']/);
    expect(layout).toMatch(/apple:\s*\[\{[^}]*url:\s*["']\/icons\/icon-192\.png["']/);
  });
});
