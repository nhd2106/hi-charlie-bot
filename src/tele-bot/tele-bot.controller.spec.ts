import { Test, TestingModule } from '@nestjs/testing';
import { TeleBotController } from './tele-bot.controller';

describe('TeleBotController', () => {
  let controller: TeleBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeleBotController],
    }).compile();

    controller = module.get<TeleBotController>(TeleBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
