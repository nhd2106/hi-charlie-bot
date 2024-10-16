import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TeleBotController } from './tele-bot.controller';
import { TeleBotService } from './tele-bot.service';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [TeleBotController],
  providers: [
    TeleBotService,
    {
      provide: 'TELEGRAF_BOT',
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('TELEGRAM_TOKEN');

        return new Telegraf(token);
      },
      inject: [ConfigService],
    },
  ],
  exports: [TeleBotService],
})
export class TeleBotModule {}
