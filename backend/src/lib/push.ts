import { messaging } from './firebase';

/**
 * Sends a push notification to a specific FCM device token.
 * @param token The FCM device token
 * @param title Notification title
 * @param body Notification body
 * @param data Optional data payload
 */
export const sendPushNotification = async (token: string, title: string, body: string, data?: Record<string, string>) => {
  try {
    if (!messaging) {
      console.log(`[Push Notification Mock] To: ${token} | Title: ${title} | Body: ${body}`);
      return { success: true, messageId: 'mock-msg-id' };
    }

    const payload = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const response = await messaging.send(payload);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};
