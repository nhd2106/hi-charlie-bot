import { Test, TestingModule } from '@nestjs/testing';
import { TeleBotService } from './tele-bot.service';

describe('TeleBotService', () => {
  let service: TeleBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeleBotService],
    }).compile();

    service = module.get<TeleBotService>(TeleBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
