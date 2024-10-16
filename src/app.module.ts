import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TeleBotModule } from './tele-bot/tele-bot.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TeleBotModule,
    ScheduleModule.forRoot(),
  ],
  providers: [],
})
export class AppModule {}
