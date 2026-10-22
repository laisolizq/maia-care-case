import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { vi } from 'vitest';

import { UsersService } from './users.service.js';
import { User } from './schemas/user.schema.js';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserModel = {
    findOneAndUpdate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getOrCreateDemoUser', () => {
    it('should return the demo user', async () => {
      const demoUser = {
        _id: new Types.ObjectId(),
        username: 'demo',
        name: 'Usuaria de demostración',
      };

      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: vi.fn().mockResolvedValue(demoUser),
      });

      const result = await service.getOrCreateDemoUser();

      expect(result).toEqual(demoUser);

      expect(mockUserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'demo' },
        {
          $setOnInsert: {
            username: 'demo',
            name: 'Usuaria de demostración',
          },
        },
        {
          upsert: true,
          new: true,
        },
      );
    });
  });
});
