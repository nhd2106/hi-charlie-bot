/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Controller, Logger, Inject } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { TeleBotService } from './tele-bot.service';

type CustomContext = Context & {
  message: Message.TextMessage;
};

@Controller()
export class TeleBotController {
  private readonly logger = new Logger(TeleBotController.name);

  constructor(
    private readonly teleBotService: TeleBotService,
    @Inject('TELEGRAF_BOT') private bot: Telegraf<Context>,
  ) {
    this.setupBotCommands();
  }

  private setupBotCommands() {
    this.bot.command('start', this.start.bind(this));
    this.bot.command('help', this.help.bind(this));
    this.bot.command('hi', this.hi.bind(this));
    this.bot.command('echo', this.echo.bind(this));
    this.bot.on('text', this.onMessage.bind(this));
    this.bot.on('sticker', this.onSticker.bind(this));
    this.bot.on('photo', this.onPhoto.bind(this));
    this.bot.hears('hello', this.onHello.bind(this));
    this.bot.on('message', this.onAnyMessage.bind(this));
  }

  async start(ctx: Context) {
    console.log('called');
    try {
      await this.sendHelpMessage(ctx, 'Welcome to your Telegram bot! ');
    } catch (error) {
      this.logger.error(`Error in start command: ${error.message}`);
    }
  }

  async help(ctx: Context) {
    try {
      await this.sendHelpMessage(ctx);
    } catch (error) {
      this.logger.error(`Error in help command: ${error.message}`);
    }
  }

  async hi(ctx: Context) {
    try {
      await ctx.reply('Hi there! How can I help you today?');
    } catch (error) {
      this.logger.error(`Error in hi command: ${error.message}`);
    }
  }

  async echo(ctx: CustomContext) {
    try {
      const message = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (message) {
        await ctx.reply(`You said: ${message}`);
      } else {
        await ctx.reply('Please provide a message after /echo');
      }
    } catch (error) {
      this.logger.error(`Error in echo command: ${error.message}`);
    }
  }

  async onMessage(ctx: Context) {
    const message = (ctx.message as Message.TextMessage).text;
    await ctx.reply(
      `I received your message: "${message}". If you need help, type /help.`,
    );
  }

  async onSticker(ctx: CustomContext) {
    this.logger.log(`Sticker received: ${JSON.stringify(ctx.message)}`);
    console.log('Sticker received', ctx.message);
    await ctx.reply('Nice sticker! 😊');
  }

  async onPhoto(ctx: Context) {
    this.logger.log(`Photo received: ${JSON.stringify(ctx.message)}`);
    console.log('Photo received', ctx.message);
    await ctx.reply('Thanks for the photo! 📸');
  }

  async onHello(ctx: Context) {
    this.logger.log(`Hello heard: ${JSON.stringify(ctx.message)}`);
    console.log('Hello heard', ctx.message);
    await ctx.reply('Hello to you too!');
  }

  async onAnyMessage(ctx: Context) {
    this.logger.log(`Received message: ${JSON.stringify(ctx.message)}`);
    // This will catch all messages that aren't caught by other handlers
  }

  private async sendHelpMessage(ctx: Context, prefix = '') {
    const message = `${prefix}Here are the available commands:
/start - Start the bot
/help - Show this help message
/echo [message] - Echo back your message
/hi - Get a friendly greeting
You can also just send any message, and I'll respond!`;
    try {
      await ctx.reply(message);
    } catch (error) {
      this.logger.error(`Error sending help message: ${error.message}`);
    }
  }
}
