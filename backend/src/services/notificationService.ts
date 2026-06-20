import Notification from '../models/Notification';
import User from '../models/User';

/**
 * Create a notification record.
 * @param recipientId - user who will receive the notification
 * @param type - type of notification (LIKE, COMMENT, FOLLOW, REPOST, SYSTEM, REPORT)
 * @param senderId - optional user who triggered the notification
 * @param postId - optional post related to the notification
 * @param reason - optional reason (used for REPORT notifications)
 */
export async function createNotification(
  recipientId: string,
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'REPOST' | 'SYSTEM' | 'REPORT',
  senderId?: string,
  postId?: string,
  reason?: string
) {
  // Prevent creating a notification for self actions (e.g., liking own post)
  if (senderId && senderId === recipientId) return;

  const notif = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    post: postId,
    reason: reason || undefined,
    isRead: false,
  });

  try {
    const { sendToUser } = require('./socketManager');
    sendToUser(recipientId, 'notification:new', notif);
  } catch (err) {
    console.error('Failed to emit socket notification:', err);
  }

  return notif;
}
