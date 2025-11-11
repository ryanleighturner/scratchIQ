/**
 * Push Notifications Service
 * Handles sending push notifications for hot tickets
 */

const database = require('./database');

class NotificationService {
  constructor() {
    this.expoApiUrl = 'https://exp.host/--/api/v2/push/send';
  }

  /**
   * Queue a notification for a user
   */
  async queueNotification(userId, gameId, type, title, body) {
    try {
      const { data, error } = await database.supabase
        .from('notification_queue')
        .insert({
          user_id: userId,
          game_id: gameId,
          notification_type: type,
          title,
          body,
          sent: false
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error queuing notification:', error.message);
      return null;
    }
  }

  /**
   * Check for hot tickets and notify users
   */
  async checkAndNotifyHotTickets() {
    try {
      console.log('Checking for hot tickets to notify users...');

      // Get all hot tickets
      const hotTickets = await database.getHotTickets('nc', 10);

      if (hotTickets.length === 0) {
        console.log('No hot tickets found');
        return;
      }

      // Get users with notifications enabled
      const { data: users, error } = await database.supabase
        .from('user_preferences')
        .select('user_id, selected_state, push_token')
        .eq('notifications_enabled', true)
        .not('push_token', 'is', null);

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('No users with notifications enabled');
        return;
      }

      // For each user, check if they have new hot tickets
      for (const user of users) {
        const userHotTickets = hotTickets.filter(
          ticket => ticket.state === user.selected_state
        );

        if (userHotTickets.length > 0) {
          const topTicket = userHotTickets[0];

          // Check if we've already notified about this ticket recently
          const recentNotification = await this.checkRecentNotification(
            user.user_id,
            topTicket.id
          );

          if (!recentNotification) {
            await this.sendPushNotification(
              user.push_token,
              `🔥 Hot Ticket Alert!`,
              `${topTicket.name} - EV: ${(topTicket.ev * 100).toFixed(1)}%`,
              {
                gameId: topTicket.id,
                type: 'hot_ticket'
              }
            );

            await this.queueNotification(
              user.user_id,
              topTicket.id,
              'hot_ticket',
              'Hot Ticket Alert',
              `${topTicket.name} has great value`
            );
          }
        }
      }

      console.log(`Processed notifications for ${users.length} users`);
    } catch (error) {
      console.error('Error in checkAndNotifyHotTickets:', error);
    }
  }

  /**
   * Check if user was recently notified about this game
   */
  async checkRecentNotification(userId, gameId) {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await database.supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .gte('created_at', yesterday.toISOString())
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking recent notification:', error);
      return false;
    }
  }

  /**
   * Send push notification via Expo
   */
  async sendPushNotification(pushToken, title, body, data = {}) {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        badge: 1
      };

      const response = await fetch(this.expoApiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'error') {
        console.error('Push notification error:', result.data.message);
        return false;
      }

      console.log('Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Save user push token
   */
  async savePushToken(userId, pushToken) {
    try {
      const { data, error } = await database.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          push_token: pushToken,
          notifications_enabled: true
        }, { onConflict: 'user_id' });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();
