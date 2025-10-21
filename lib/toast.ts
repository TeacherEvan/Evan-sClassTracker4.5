// Toast notification utility
// Replaces alert() with modern toast notifications

export interface Toast {
    id: string;
    title: string;
    titleTh: string;
    message: string;
    messageTh: string;
    type: "success" | "error" | "warning" | "info";
    duration?: number; // milliseconds
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

    error(message: string, messageTh: string, title = "Error", titleTh = "ข้อผิดพลาด") {
        this.show({
            title,
            titleTh,
            message,
            messageTh,
            type: "error",
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
