/**
 * Offline Message Queue
 * Queues messages when offline and syncs when connection returns
 */

interface QueuedMessage {
  id: string;
  type: "direct" | "group";
  data: {
    senderId: string;
    recipientId?: string;
    schoolId?: string;
    groupId?: string;
    content: string;
    contentTh: string;
  };
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = "message_queue";
const MAX_RETRIES = 3;

/**
 * Get message queue from localStorage
 */
function getQueue(): QueuedMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load message queue:", error);
    return [];
  }
}

/**
 * Save message queue to localStorage
 */
function saveQueue(queue: QueuedMessage[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save message queue:", error);
  }
}

/**
 * Add a message to the offline queue
 */
export function queueMessage(
  type: "direct" | "group",
  data: QueuedMessage["data"],
): string {
  const message: QueuedMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  const queue = getQueue();
  queue.push(message);
  saveQueue(queue);

  console.log("Message queued for offline sync:", message.id);
  return message.id;
}

/**
 * Remove a message from the queue
 */
export function removeFromQueue(messageId: string): void {
  const queue = getQueue();
  const filtered = queue.filter((m) => m.id !== messageId);
  saveQueue(filtered);
}

/**
 * Get all queued messages
 */
export function getQueuedMessages(): QueuedMessage[] {
  return getQueue();
}

/**
 * Process the message queue (send all pending messages)
 */
export async function processQueue(
  sendDirectMessage: (data: {
    senderId: string;
    recipientId: string;
    content: string;
    contentTh: string;
  }) => Promise<unknown>,
  sendGroupMessage: (data: {
    senderId: string;
    schoolId?: string;
    groupId?: string;
    content: string;
    contentTh: string;
  }) => Promise<unknown>,
): Promise<{ succeeded: number; failed: number }> {
  const queue = getQueue();
  let succeeded = 0;
  let failed = 0;

  for (const message of queue) {
    try {
      if (message.type === "direct" && message.data.recipientId) {
        await sendDirectMessage({
          senderId: message.data.senderId,
          recipientId: message.data.recipientId,
          content: message.data.content,
          contentTh: message.data.contentTh,
        });
      } else if (message.type === "group") {
        await sendGroupMessage({
          senderId: message.data.senderId,
          schoolId: message.data.schoolId,
          groupId: message.data.groupId,
          content: message.data.content,
          contentTh: message.data.contentTh,
        });
      }

      // Success - remove from queue
      removeFromQueue(message.id);
      succeeded++;
      console.log("Queued message sent successfully:", message.id);
    } catch (error) {
      console.error("Failed to send queued message:", message.id, error);

      // Increment retry count
      message.retries++;

      if (message.retries >= MAX_RETRIES) {
        // Max retries reached - remove from queue
        removeFromQueue(message.id);
        console.warn("Message removed after max retries:", message.id);
      } else {
        // Update retry count in queue
        const updatedQueue = getQueue().map((m) =>
          m.id === message.id ? message : m,
        );
        saveQueue(updatedQueue);
      }

      failed++;
    }
  }

  return { succeeded, failed };
}

/**
 * Clear the entire message queue
 */
export function clearQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_STORAGE_KEY);
  console.log("Message queue cleared");
}

/**
 * Get queue size
 */
export function getQueueSize(): number {
  return getQueue().length;
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

/**
 * Setup online/offline event listeners
 */
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
