import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import Together from 'together-ai';

const together = new Together({
  apiKey: 'f6b3b2b3961107eb72796020e6e782754c5136d68af59de35293823d579565fe',
});

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

  async chat(prompt: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const response = await together.chat.completions.create({
      model: 'meta-llama/Llama-Vision-Free',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ['<|eot_id|>', '<|eom_id|>'],
      truncate: 130560,
      stream: false,
    });
    console.log(response);
    return response.choices[0].message.content;
  }
}
