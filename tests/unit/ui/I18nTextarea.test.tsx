import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nTextarea } from "@/components/ui/I18nTextarea";
import { LanguageProvider } from "@/lib/language-context";
import React from "react";

// Test wrapper with LanguageProvider
const renderWithProvider = (component: React.ReactNode) => {
  return render(<LanguageProvider>{component}</LanguageProvider>);
};

describe("I18nTextarea", () => {
  it("renders both English and Thai textarea with labels", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText(/description \(english\)/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/คำอธิบาย \(ไทย\)/i)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("displays initial values in both textareas", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Notes"
        labelTh="หมายเหตุ"
        valueEn="English notes"
        valueTh="บันทึกภาษาไทย"
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/notes \(english\)/i)).toHaveValue(
      "English notes",
    );
    expect(screen.getByLabelText(/หมายเหตุ \(ไทย\)/i)).toHaveValue(
      "บันทึกภาษาไทย",
    );
  });

  it("calls onChangeEn when English textarea changes", async () => {
    const handleChangeEn = vi.fn();
    const handleChangeTh = vi.fn();

    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={handleChangeEn}
        onChangeTh={handleChangeTh}
      />,
    );

    const enTextarea = screen.getByLabelText(/description \(english\)/i);
    fireEvent.change(enTextarea, { target: { value: "New English text" } });

    await waitFor(() => {
      expect(handleChangeEn).toHaveBeenCalledWith("New English text");
    });
    expect(handleChangeTh).not.toHaveBeenCalled();
  });

  it("calls onChangeTh when Thai textarea changes", async () => {
    const handleChangeEn = vi.fn();
    const handleChangeTh = vi.fn();

    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={handleChangeEn}
        onChangeTh={handleChangeTh}
      />,
    );

    const thTextarea = screen.getByLabelText(/คำอธิบาย \(ไทย\)/i);
    fireEvent.change(thTextarea, { target: { value: "ข้อความภาษาไทยใหม่" } });

    await waitFor(() => {
      expect(handleChangeTh).toHaveBeenCalledWith("ข้อความภาษาไทยใหม่");
    });
    expect(handleChangeEn).not.toHaveBeenCalled();
  });

  it("applies custom rows prop", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
        rows={5}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    textareas.forEach((textarea) => {
      expect(textarea).toHaveAttribute("rows", "5");
    });
  });

  it("applies disabled state to both textareas", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn="Disabled"
        valueTh="ปิดใช้งาน"
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
        disabled={true}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    textareas.forEach((textarea) => {
      expect(textarea).toBeDisabled();
    });
  });

  it("applies required attribute to both textareas", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
        required={true}
      />,
    );

    const textareas = screen.getAllByRole("textbox");
    textareas.forEach((textarea) => {
      expect(textarea).toBeRequired();
    });
  });

  it("applies placeholder text", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
        placeholder="Enter description..."
        placeholderTh="กรอกรายละเอียด..."
      />,
    );

    expect(
      screen.getByLabelText(/description[\s\S]*?\(english\)/i),
    ).toHaveAttribute("placeholder", "Enter description...");
    expect(screen.getByLabelText(/คำอธิบาย[\s\S]*?\(ไทย\)/i)).toHaveAttribute(
      "placeholder",
      "กรอกรายละเอียด...",
    );
  });

  it("applies custom className", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
        className="custom-class"
      />,
    );

    const container = screen.getByTestId("i18n-textarea-container");
    expect(container).toHaveClass("custom-class");
  });

  it("renders labels with correct language suffix", () => {
    renderWithProvider(
      <I18nTextarea
        labelEn="Bio"
        labelTh="ชีวประวัติ"
        valueEn=""
        valueTh=""
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
      />,
    );

    expect(screen.getByText(/bio \(english\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ชีวประวัติ \(ไทย\)/i)).toBeInTheDocument();
  });

  it("handles controlled component updates from parent", () => {
    const { rerender } = renderWithProvider(
      <I18nTextarea
        labelEn="Description"
        labelTh="คำอธิบาย"
        valueEn="Initial"
        valueTh="เริ่มต้น"
        onChangeEn={vi.fn()}
        onChangeTh={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/description \(english\)/i)).toHaveValue(
      "Initial",
    );
    expect(screen.getByLabelText(/คำอธิบาย \(ไทย\)/i)).toHaveValue("เริ่มต้น");

    rerender(
      <LanguageProvider>
        <I18nTextarea
          labelEn="Description"
          labelTh="คำอธิบาย"
          valueEn="Updated"
          valueTh="อัปเดตแล้ว"
          onChangeEn={vi.fn()}
          onChangeTh={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.getByLabelText(/description \(english\)/i)).toHaveValue(
      "Updated",
    );
    expect(screen.getByLabelText(/คำอธิบาย \(ไทย\)/i)).toHaveValue(
      "อัปเดตแล้ว",
    );
  });
});
