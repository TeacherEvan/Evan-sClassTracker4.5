import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nInput } from "../../../components/ui/I18nInput";
import { I18nString } from "@/lib/hooks/useI18n";

describe("I18nInput", () => {
  const defaultProps = {
    label: { en: "Name", th: "ชื่อ" },
    value: { en: "", th: "" },
    onChange: vi.fn(),
    language: "en" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders label in current language", () => {
    render(<I18nInput {...defaultProps} language="en" />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();

    render(<I18nInput {...defaultProps} language="th" />);
    expect(screen.getByLabelText("ชื่อ")).toBeInTheDocument();
  });

  it("renders input with current language value", () => {
    render(
      <I18nInput
        {...defaultProps}
        value={{ en: "Hello", th: "สวัสดี" }}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Hello");

    render(
      <I18nInput
        {...defaultProps}
        value={{ en: "Hello", th: "สวัสดี" }}
        language="th"
      />,
    );
    expect(screen.getByLabelText("ชื่อ")).toHaveValue("สวัสดี");
  });

  it("calls onChange with updated i18n object when input changes", () => {
    render(<I18nInput {...defaultProps} language="en" />);
    const input = screen.getByLabelText("Name");

    fireEvent.change(input, { target: { value: "John" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      en: "John",
      th: "",
    });
  });

  it("updates only the current language value", () => {
    const initialValue = { en: "Hello", th: "สวัสดี" };
    render(<I18nInput {...defaultProps} value={initialValue} language="th" />);
    const input = screen.getByLabelText("ชื่อ");

    fireEvent.change(input, { target: { value: "สวัสดีครับ" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      en: "Hello",
      th: "สวัสดีครับ",
    });
  });

  it("syncs input value when language prop changes", () => {
    const { rerender } = render(
      <I18nInput
        {...defaultProps}
        value={{ en: "Hello", th: "สวัสดี" }}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Hello");

    rerender(
      <I18nInput
        {...defaultProps}
        value={{ en: "Hello", th: "สวัสดี" }}
        language="th"
      />,
    );
    expect(screen.getByLabelText("ชื่อ")).toHaveValue("สวัสดี");
  });

  it("syncs input value when value prop changes", () => {
    const { rerender } = render(
      <I18nInput
        {...defaultProps}
        value={{ en: "Old", th: "เก่า" }}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Old");

    rerender(
      <I18nInput
        {...defaultProps}
        value={{ en: "New", th: "ใหม่" }}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("New");
  });

  it("forwards additional props to input element", () => {
    render(
      <I18nInput
        {...defaultProps}
        placeholder="Enter name"
        disabled
        required
        id="test-input"
      />,
    );
    const input = screen.getByLabelText("Name");

    expect(input).toHaveAttribute("placeholder", "Enter name");
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("id", "test-input");
  });

  it("handles empty value gracefully", () => {
    const { rerender } = render(
      <I18nInput
        {...defaultProps}
        value={null as unknown as I18nString | null}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("");

    rerender(
      <I18nInput
        {...defaultProps}
        value={undefined as unknown as I18nString | undefined}
        language="en"
      />,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("renders with correct structure (label + input wrapper)", () => {
    render(<I18nInput {...defaultProps} language="en" />);
    const label = screen.getByLabelText("Name");
    const input = screen.getByLabelText("Name");

    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(label.parentElement).toBeInTheDocument();
  });
});
