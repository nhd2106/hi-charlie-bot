import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';

@Injectable()
export class TeleBotService implements OnModuleInit {
  constructor(@Inject('TELEGRAF_BOT') private bot: Telegraf<Context>) {}

  async onModuleInit() {
    this.bot.on('message', (ctx) => {
      console.log('Raw message received:', ctx.message);
    });

    await this.bot.launch();
  }

  async sendMessage(chatId: number, message: string) {
    console.log(`Attempting to send message to chat ${chatId}: ${message}`);
    try {
      await this.bot.telegram.sendMessage(chatId, message);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async sendPhoto(chatId: number, photoUrl: string, caption?: string) {
    await this.bot.telegram.sendPhoto(chatId, photoUrl, { caption });
  }

  async getMe() {
    return await this.bot.telegram.getMe();
  }

  async checkConnection(): Promise<boolean> {
    try {
      const botInfo = await this.getMe();
      console.log(
        `Bot connected successfully. Bot name: ${botInfo.first_name}`,
      );
      return true;
    } catch (error) {
      console.error('Failed to connect to the bot:', error.message);
      return false;
    }
  }
}
