export type NotificationType = 'order' | 'promotion' | 'newsletter' | 'system';

export interface NotificationRow {
  id: string;
  id_user: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
