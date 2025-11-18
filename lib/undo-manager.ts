/**
 * Undo Manager Utility
 * Manages deferred deletions with undo capability
 * 
 * Usage:
 * ```typescript
 * const undoManager = UndoManager.getInstance();
 * 
 * // Schedule deletion with undo window
 * undoManager.scheduleDelete({
 *   id: classId,
 *   type: "class",
 *   onExecute: async () => await deleteClass({ classId }),
 *   onCancel: () => console.log("Deletion cancelled"),
 *   data: classData // Optional: store for restoration
 * });
 * ```
 */

import { logger } from "./logger";

export interface UndoableAction<T = unknown> {
    id: string;
    type: "class" | "student" | "location" | "other";
    onExecute: () => Promise<void>;
    onCancel?: () => void;
    data?: T; // Optional data to store for potential restoration
    description?: string;
    descriptionTh?: string;
}

interface PendingAction<T = unknown> extends UndoableAction<T> {
    timerId: NodeJS.Timeout;
    scheduledAt: number;
}

class UndoManager {
    private static instance: UndoManager;
    private pendingActions: Map<string, PendingAction> = new Map();
    private readonly defaultDelay = 10000; // 10 seconds

    private constructor() {
        // Singleton pattern
    }

    static getInstance(): UndoManager {
        if (!UndoManager.instance) {
            UndoManager.instance = new UndoManager();
        }
        return UndoManager.instance;
    }

    /**
     * Schedule a deletion with undo capability
     * @param action - The action to schedule
     * @param delay - Delay in milliseconds before execution (default: 10000ms)
     * @returns Function to cancel the action
     */
    scheduleDelete<T>(action: UndoableAction<T>, delay = this.defaultDelay): () => void {
        // Cancel existing action with same ID if any
        this.cancel(action.id);

        // Create timer for deferred execution
        const timerId = setTimeout(() => {
            this.execute(action.id);
        }, delay);

        // Store pending action
        const pendingAction: PendingAction<T> = {
            ...action,
            timerId,
            scheduledAt: Date.now(),
        };

        this.pendingActions.set(action.id, pendingAction);

        logger.debug("Scheduled deletion", {
            id: action.id,
            type: action.type,
            delay,
        });

        // Return cancel function
        return () => this.cancel(action.id);
    }

    /**
     * Cancel a pending action (undo)
     */
    cancel(id: string): boolean {
        const action = this.pendingActions.get(id);
        if (!action) {
            logger.warn("Attempted to cancel non-existent action", { id });
            return false;
        }

        // Clear timer
        clearTimeout(action.timerId);

        // Call cancel callback if provided
        if (action.onCancel) {
            try {
                action.onCancel();
            } catch (error) {
                logger.error("Error in cancel callback", error, {
                    component: "UndoManager",
                    actionId: id,
                });
            }
        }

        // Remove from pending
        this.pendingActions.delete(id);

        logger.debug("Cancelled deletion", {
            id,
            type: action.type,
        });

        return true;
    }

    /**
     * Execute a pending action immediately
     */
    private async execute(id: string): Promise<void> {
        const action = this.pendingActions.get(id);
        if (!action) {
            logger.warn("Attempted to execute non-existent action", { id });
            return;
        }

        // Remove from pending BEFORE execution (prevents double execution)
        this.pendingActions.delete(id);

        try {
            await action.onExecute();
            logger.debug("Executed deletion", {
                id,
                type: action.type,
            });
        } catch (error) {
            logger.error("Error executing deletion", error, {
                component: "UndoManager",
                actionId: id,
                actionType: action.type,
            });
            // Re-throw to allow caller to handle
            throw error;
        }
    }

    /**
     * Cancel all pending actions
     */
    cancelAll(): void {
        const count = this.pendingActions.size;
        this.pendingActions.forEach((action) => {
            clearTimeout(action.timerId);
            if (action.onCancel) {
                try {
                    action.onCancel();
                } catch (error) {
                    logger.error("Error in cancel callback", error, {
                        component: "UndoManager",
                        actionId: action.id,
                    });
                }
            }
        });
        this.pendingActions.clear();
        logger.debug("Cancelled all pending deletions", { count });
    }

    /**
     * Get count of pending actions
     */
    getPendingCount(): number {
        return this.pendingActions.size;
    }

    /**
     * Get pending action by ID
     */
    getPendingAction(id: string): UndoableAction | undefined {
        return this.pendingActions.get(id);
    }

    /**
     * Get remaining time for a pending action (in milliseconds)
     */
    getRemainingTime(id: string): number | undefined {
        const action = this.pendingActions.get(id);
        if (!action) return undefined;

        const elapsed = Date.now() - action.scheduledAt;
        const remaining = this.defaultDelay - elapsed;
        return Math.max(0, remaining);
    }
}

// Export singleton instance
export const undoManager = UndoManager.getInstance();

// Export class for testing
export { UndoManager };
