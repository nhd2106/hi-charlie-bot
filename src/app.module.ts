import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TeleBotModule } from './tele-bot/tele-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TeleBotModule,
  ],
})
export class AppModule {}
