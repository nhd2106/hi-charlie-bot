/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Controller, Logger, Inject } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { TeleBotService } from './tele-bot.service';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as cheerio from 'cheerio';

type CustomContext = Context & {
  message: Message.TextMessage;
};

@Controller()
export class TeleBotController {
  private readonly logger = new Logger(TeleBotController.name);
  private subscribedChatIds: Set<number> = new Set();

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
    this.bot.command('ask', this.ask.bind(this));
    this.bot.command('subscribe', this.subscribe.bind(this));
    this.bot.command('unsubscribe', this.unsubscribe.bind(this));
    this.bot.on('text', this.onMessage.bind(this));
    this.bot.on('sticker', this.onSticker.bind(this));
    this.bot.on('photo', this.onPhoto.bind(this));
    this.bot.hears('hello', this.onHello.bind(this));
    this.bot.on('message', this.onAnyMessage.bind(this));
  }

  async start(ctx: Context) {
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

  async ask(ctx: CustomContext) {
    try {
      const question = ctx.message.text.split(' ').slice(1).join(' ').trim();
      if (question) {
        // Start the typing indicator
        await ctx.sendChatAction('typing');
        const response = await this.teleBotService.chat(question);
        await ctx.reply(response, {
          parse_mode: 'Markdown',
        });
      } else {
        await ctx.reply('Please provide a question after /ask');
      }
    } catch (error) {
      this.logger.error(`Error in ask command: ${error.message}`);
      await ctx.reply(
        'Sorry, I encountered an error while processing your question.',
      );
    }
  }

  async onMessage(ctx: CustomContext) {
    const message = ctx.message.text;

    if (message.startsWith('/')) {
      // It's a command, let the other handlers deal with it
      return;
    }

    try {
      // Start the typing indicator
      await ctx.sendChatAction('typing');
      const response = await this.getOllamaResponse(message);
      await ctx.reply(response, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Error in onMessage: ${error.message}`);
      await ctx.reply(
        'Sorry, I encountered an error while processing your message.',
      );
    }
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
/ask [question] - Ask any question and get an AI-powered response
/subscribe - Subscribe to news updates
/unsubscribe - Unsubscribe from news updates
You can also just send any message, and I'll respond!`;
    try {
      await ctx.reply(message, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Error sending help message: ${error.message}`);
    }
  }

  async subscribe(ctx: Context) {
    try {
      const chatId = ctx.chat.id;
      this.subscribedChatIds.add(chatId);
      await ctx.reply('You have successfully subscribed to the bot!');
    } catch (error) {
      this.logger.error(`Error in subscribe command: ${error.message}`);
    }
  }

  async unsubscribe(ctx: Context) {
    try {
      const chatId = ctx.chat.id;
      this.subscribedChatIds.delete(chatId);
      await ctx.reply('You have successfully unsubscribed from the bot!');
    } catch (error) {
      this.logger.error(`Error in unsubscribe command: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async fetchAndProcessNews() {
    console.log(this.subscribedChatIds);
    this.logger.log('Fetching and processing news');
    try {
      const newsItems = await this.scrapeNews();
      await this.sendNewsUpdate(newsItems);
      this.logger.log('News update sent successfully');
    } catch (error) {
      this.logger.error(`Error processing news: ${error.message}`);
    }
  }

  private async scrapeNews(): Promise<string[]> {
    const response = await axios.get('https://baomoi.com/');
    const $ = cheerio.load(response.data);
    const newsItems: string[] = [];

    $('.story')
      .slice(0, 10)
      .each((index, element) => {
        const title = $(element).find('.story__heading').text().trim();
        const link = $(element).find('a').attr('href');
        newsItems.push(`${index + 1}. ${title}\nhttps://baomoi.com${link}\n`);
      });

    return newsItems;
  }

  private async sendNewsUpdate(newsItems: string[]) {
    const newsMessage = `🗞️ Top 10 Hot News from Báo Mới:\n\n${newsItems.join('\n')}`;
    for (const chatId of this.subscribedChatIds) {
      try {
        console.log(chatId);
        await this.teleBotService.sendMessage(chatId, newsMessage);
      } catch (error) {
        this.logger.error(
          `Failed to send message to ${chatId}: ${error.message}`,
        );
        // Optionally remove the chat ID if it's no longer valid
        // this.subscribedChatIds.delete(chatId);
      }
    }
  }

  private async getOllamaResponse(message: string): Promise<string> {
    try {
      const response = await this.teleBotService.chat(message);
      return response;
    } catch (error) {
      this.logger.error(`Error calling Ollama API: ${error.message}`);
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Response data: ${JSON.stringify(error.response?.data)}`,
        );
        this.logger.error(`Response status: ${error.response?.status}`);
      }
      throw new Error('Failed to get response from Ollama');
    }
  }
}
