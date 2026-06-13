import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useI18n, useSetI18n } from "../../../lib/hooks/useI18n";

describe("useI18n", () => {
  it("exports useI18n hook", () => {
    expect(useI18n).toBeDefined();
    expect(typeof useI18n).toBe("function");
  });

  it("returns English string when language is 'en'", () => {
    const value = { en: "Hello", th: "สวัสดี" };
    const { result } = renderHook(() => useI18n(value, "en"));
    expect(result.current).toBe("Hello");
  });

  it("returns Thai string when language is 'th'", () => {
    const value = { en: "Hello", th: "สวัสดี" };
    const { result } = renderHook(() => useI18n(value, "th"));
    expect(result.current).toBe("สวัสดี");
  });

  it("handles empty strings", () => {
    const value = { en: "", th: "" };
    const { result: resultEn } = renderHook(() => useI18n(value, "en"));
    const { result: resultTh } = renderHook(() => useI18n(value, "th"));
    expect(resultEn.current).toBe("");
    expect(resultTh.current).toBe("");
  });

  it("handles special characters", () => {
    const value = { en: "Hello, World!", th: "สวัสดี, โลก!" };
    const { result: resultEn } = renderHook(() => useI18n(value, "en"));
    const { result: resultTh } = renderHook(() => useI18n(value, "th"));
    expect(resultEn.current).toBe("Hello, World!");
    expect(resultTh.current).toBe("สวัสดี, โลก!");
  });
});

describe("useSetI18n", () => {
  it("exports useSetI18n hook", () => {
    expect(useSetI18n).toBeDefined();
    expect(typeof useSetI18n).toBe("function");
  });

  type SetValueFn = (val: { en: string; th: string } | ((prev: { en: string; th: string }) => { en: string; th: string })) => void;

  it("returns a function that updates only the English value", () => {
    const currentValue = { current: { en: "Hello", th: "สวัสดี" } };
    const setValue: SetValueFn = (val) => {
      if (typeof val === "function") {
        currentValue.current = val(currentValue.current);
      } else {
        currentValue.current = val;
      }
    };

    const { result } = renderHook(() => useSetI18n(setValue, "en"));
    act(() => result.current("Hi"));

    expect(currentValue.current).toEqual({ en: "Hi", th: "สวัสดี" });
  });

  it("returns a function that updates only the Thai value", () => {
    const currentValue = { current: { en: "Hello", th: "สวัสดี" } };
    const setValue: SetValueFn = (val) => {
      if (typeof val === "function") {
        currentValue.current = val(currentValue.current);
      } else {
        currentValue.current = val;
      }
    };

    const { result } = renderHook(() => useSetI18n(setValue, "th"));
    act(() => result.current("สวัสดีครับ"));

    expect(currentValue.current).toEqual({ en: "Hello", th: "สวัสดีครับ" });
  });

  it("preserves the other language when updating", () => {
    const currentValue = { current: { en: "Hello", th: "สวัสดี" } };
    const setValue: SetValueFn = (val) => {
      if (typeof val === "function") {
        currentValue.current = val(currentValue.current);
      } else {
        currentValue.current = val;
      }
    };

    const { result: resultEn } = renderHook(() => useSetI18n(setValue, "en"));
    act(() => resultEn.current("Hi there"));
    expect(currentValue.current.th).toBe("สวัสดี");

    const { result: resultTh } = renderHook(() => useSetI18n(setValue, "th"));
    act(() => resultTh.current("สวัสดีครับ"));
    expect(currentValue.current.en).toBe("Hi there");
  });

  it("handles empty string updates", () => {
    const currentValue = { current: { en: "Hello", th: "สวัสดี" } };
    const setValue: SetValueFn = (val) => {
      if (typeof val === "function") {
        currentValue.current = val(currentValue.current);
      } else {
        currentValue.current = val;
      }
    };

    const { result } = renderHook(() => useSetI18n(setValue, "en"));
    act(() => result.current(""));

    expect(currentValue.current).toEqual({ en: "", th: "สวัสดี" });
  });
});