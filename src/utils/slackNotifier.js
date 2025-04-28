import axios from 'axios';
import logger from './logger.js';

class SlackNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendError(message) {
    try {
      if (!this.webhookUrl) {
        logger.warn('Slack webhook URL not configured');
        return;
      }

      await axios.post(this.webhookUrl, {
        text: `🚨 Design Tokens Processing Error\n\`\`\`${message}\`\`\``,
        username: 'Design Tokens Bot',
        icon_emoji: ':robot_face:'
      });

      logger.info('Error notification sent to Slack');
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }

  async sendSuccess(message) {
    try {
      if (!this.webhookUrl) {
        logger.warn('Slack webhook URL not configured');
        return;
      }

      await axios.post(this.webhookUrl, {
        text: `✅ Design Tokens Processing Success\n${message}`,
        username: 'Design Tokens Bot',
        icon_emoji: ':robot_face:'
      });

      logger.info('Success notification sent to Slack');
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }
}

export default new SlackNotifier(process.env.SLACK_WEBHOOK_URL); 