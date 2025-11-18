// Toast notification utility
// Replaces alert() with modern toast notifications

export interface ErrorContext {
    errorCode?: string;
    errorOrigin: string; // Component/file name
    errorFunction?: string; // Function/mutation name
    stackTrace?: string;
    userAction?: string; // What user was trying to do
    componentState?: string; // JSON string of relevant state
}

export interface ToastAction {
    label: string;
    labelTh: string;
    onClick: () => void;
}

export interface Toast {
    id: string;
    title: string;
    titleTh: string;
    message: string;
    messageTh: string;
    type: "success" | "error" | "warning" | "info";
    duration?: number; // milliseconds
    errorContext?: ErrorContext; // Additional context for error reporting
    showReportButton?: boolean; // Show "Send to Admin" button
    action?: ToastAction; // Optional action button (for undo, etc.)
}

type ToastListener = (toast: Toast) => void;

class ToastManager {
    private listeners: Set<ToastListener> = new Set();

    subscribe(listener: ToastListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    show(toast: Omit<Toast, "id">) {
        const fullToast: Toast = {
            ...toast,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            duration: toast.duration || 5000,
        };

        this.listeners.forEach((listener) => listener(fullToast));
    }

    success(message: string, messageTh: string, title = "Success", titleTh = "สำเร็จ") {
        this.show({
            title,
            titleTh,
            message,
            messageTh,
            type: "success",
        });
    }

    error(
        message: string,
        messageTh: string,
        title = "Error",
        titleTh = "ข้อผิดพลาด",
        errorContext?: ErrorContext
    ) {
        this.show({
            title,
            titleTh,
            message,
            messageTh,
            type: "error",
            errorContext,
            showReportButton: !!errorContext, // Show button if context provided
            duration: 8000, // Longer duration for errors
        });
    }

    warning(message: string, messageTh: string, title = "Warning", titleTh = "คำเตือน") {
        this.show({
            title,
            titleTh,
            message,
            messageTh,
            type: "warning",
        });
    }

    info(message: string, messageTh: string, title = "Info", titleTh = "ข้อมูล") {
        this.show({
            title,
            titleTh,
            message,
            messageTh,
            type: "info",
        });
    }
}

export const toast = new ToastManager();
