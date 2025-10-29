"use client";

import { useLanguage } from "@/lib/language-context";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";

export interface WizardStep {
    id: string;
    titleEn: string;
    titleTh: string;
    descriptionEn?: string;
    descriptionTh?: string;
    component: ReactNode;
    validate?: () => Promise<boolean> | boolean;
    optional?: boolean;
}

interface WizardFormProps {
    steps: WizardStep[];
    onComplete: () => void;
    onCancel?: () => void;
    showProgressBar?: boolean;
    allowSkipOptional?: boolean;
    className?: string;
}

/**
 * Reusable wizard form component - Pattern #21
 * 
 * Replaces long scrolling forms with step-by-step navigation.
 * 
 * Features:
 * - Bilingual support (EN/TH)
 * - Progress indicator with step validation
 * - Optional step skipping
 * - Keyboard navigation (Enter to advance, Escape to cancel)
 * - Step validation before advancement
 * - Accessible (ARIA labels, focus management)
 * - Responsive design (mobile/desktop)
 * 
 * Usage:
 * ```tsx
 * const steps: WizardStep[] = [
 *   {
 *     id: "basic-info",
 *     titleEn: "Basic Information",
 *     titleTh: "ข้อมูลพื้นฐาน",
 *     component: <BasicInfoStep />,
 *     validate: async () => {
 *       return firstName.trim() !== "";
 *     }
 *   },
 *   {
 *     id: "details",
 *     titleEn: "Additional Details",
 *     titleTh: "รายละเอียดเพิ่มเติม",
 *     component: <DetailsStep />,
 *     optional: true
 *   }
 * ];
 * 
 * <WizardForm
 *   steps={steps}
 *   onComplete={() => handleSubmit()}
 *   onCancel={() => setShowWizard(false)}
 *   showProgressBar={true}
 * />
 * ```
 */
export function WizardForm({
    steps,
    onComplete,
    onCancel,
    showProgressBar = true,
    allowSkipOptional = true,
    className = "",
}: WizardFormProps) {
    const { t } = useLanguage();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [isValidating, setIsValidating] = useState(false);

    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

    // Validate current step before advancing
    const validateCurrentStep = async (): Promise<boolean> => {
        if (!currentStep.validate) {
            return true; // No validation required
        }

        setIsValidating(true);
        try {
            const isValid = await currentStep.validate();
            return isValid;
        } catch (error) {
            console.error("Validation error:", error);
            return false;
        } finally {
            setIsValidating(false);
        }
    };

    // Navigate to next step
    const handleNext = async () => {
        const isValid = await validateCurrentStep();

        if (!isValid && !currentStep.optional) {
            return; // Cannot proceed if validation fails on required step
        }

        if (isValid) {
            setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
        }

        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    // Navigate to previous step
    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    // Skip current step (only for optional steps)
    const handleSkip = () => {
        if (currentStep.optional && allowSkipOptional) {
            if (isLastStep) {
                onComplete();
            } else {
                setCurrentStepIndex((prev) => prev + 1);
            }
        }
    };

    // Jump to specific step
    const handleJumpToStep = (stepIndex: number) => {
        // Only allow jumping to completed steps or the next step after last completed
        const maxAllowedStep = Math.max(...Array.from(completedSteps), -1) + 1;
        if (stepIndex <= maxAllowedStep && stepIndex < steps.length) {
            setCurrentStepIndex(stepIndex);
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && onCancel) {
            onCancel();
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleNext();
        }
    };

    return (
        <div
            className={`flex flex-col h-full ${className}`}
            onKeyDown={handleKeyDown}
            role="region"
            aria-label={t("Form wizard", "ตัวช่วยฟอร์ม")}
        >
            {/* Progress Bar */}
            {showProgressBar && (
                <div className="mb-6">
                    <div className="relative">
                        {/* Progress bar background */}
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-in-out"
                                style={{ width: `${progressPercentage}%` }}
                                role="progressbar"
                                aria-valuenow={currentStepIndex + 1}
                                aria-valuemin={1}
                                aria-valuemax={steps.length}
                            />
                        </div>

                        {/* Step indicators */}
                        <div className="flex justify-between mt-2">
                            {steps.map((step, index) => {
                                const isCompleted = completedSteps.has(index);
                                const isCurrent = index === currentStepIndex;
                                const isAccessible = index <= Math.max(...Array.from(completedSteps), -1) + 1;

                                return (
                                    <button
                                        key={step.id}
                                        type="button"
                                        onClick={() => handleJumpToStep(index)}
                                        disabled={!isAccessible}
                                        className={`flex flex-col items-center flex-1 min-w-0 px-1 transition-opacity ${isAccessible
                                                ? "cursor-pointer hover:opacity-80"
                                                : "cursor-not-allowed opacity-40"
                                            }`}
                                        aria-label={`${t("Step", "ขั้นตอน")} ${index + 1}: ${t(step.titleEn, step.titleTh)
                                            }`}
                                        aria-current={isCurrent ? "step" : undefined}
                                    >
                                        {/* Step number/checkmark */}
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${isCompleted
                                                    ? "bg-green-500 text-white"
                                                    : isCurrent
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Step title */}
                                        <div
                                            className={`text-xs text-center truncate w-full ${isCurrent
                                                    ? "text-blue-600 dark:text-blue-400 font-medium"
                                                    : "text-gray-600 dark:text-gray-400"
                                                }`}
                                        >
                                            {t(step.titleEn, step.titleTh)}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Step header */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t(currentStep.titleEn, currentStep.titleTh)}
                </h2>
                {(currentStep.descriptionEn || currentStep.descriptionTh) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t(currentStep.descriptionEn || "", currentStep.descriptionTh || "")}
                    </p>
                )}
                {currentStep.optional && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {t("Optional", "ไม่บังคับ")}
                    </span>
                )}
            </div>

            {/* Step content */}
            <div className="flex-grow overflow-y-auto mb-6">
                {currentStep.component}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Left side: Previous/Cancel */}
                <div>
                    {!isFirstStep ? (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
                            aria-label={t("Previous step", "ขั้นตอนก่อนหน้า")}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            {t("Previous", "ก่อนหน้า")}
                        </button>
                    ) : onCancel ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            aria-label={t("Cancel", "ยกเลิก")}
                        >
                            {t("Cancel", "ยกเลิก")}
                        </button>
                    ) : (
                        <div /> // Empty spacer
                    )}
                </div>

                {/* Right side: Skip/Next/Complete */}
                <div className="flex items-center gap-2">
                    {currentStep.optional && allowSkipOptional && !isLastStep && (
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            aria-label={t("Skip this step", "ข้ามขั้นตอนนี้")}
                        >
                            {t("Skip", "ข้าม")}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={isValidating}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={
                            isLastStep
                                ? t("Complete wizard", "เสร็จสิ้น")
                                : t("Next step", "ขั้นตอนถัดไป")
                        }
                    >
                        {isValidating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("Validating...", "กำลังตรวจสอบ...")}
                            </>
                        ) : isLastStep ? (
                            <>
                                {t("Complete", "เสร็จสิ้น")}
                                <Check className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                {t("Next", "ถัดไป")}
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Step counter */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t(
                    `Step ${currentStepIndex + 1} of ${steps.length}`,
                    `ขั้นตอน ${currentStepIndex + 1} จาก ${steps.length}`
                )}
            </div>
        </div>
    );
}
