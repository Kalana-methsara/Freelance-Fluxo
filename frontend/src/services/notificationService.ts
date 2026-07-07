
import { getSocket } from "./socketClient";
import api from "./api";

export type NotificationType =
  | "hire_offer"
  | "hire_accepted"
  | "hire_declined"
  | "proposal_received"
  | "milestone_submitted"
  | "job_completed";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  jobId?: string;
  conversationId?: string;
  read: boolean;
  createdAt: string;
}

class NotificationService {
  async list(params: { page?: number; limit?: number } = {}): Promise<AppNotification[]> {
    const { data } = await api.get("/notifications", { params });
    return data;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch(`/notifications/read-all`);
  }

  onNotification(callback: (notification: AppNotification) => void): void {
    getSocket()?.on("notification", callback);
  }

  offNotification(): void {
    getSocket()?.off("notification");
  }
}

export default new NotificationService();