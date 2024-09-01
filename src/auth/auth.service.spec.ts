import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService, {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn()
          }
        },
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('user repository should be defined', () => {
    expect(userRepository).toBeDefined();
  })

  describe('register', () => {
    it('should register user', async () => {
      const loginAuthDto = {
        email: 'test@example.com',
        userName: 'testUser',
        password: 'testPassword',
      };

      const savedUser: User = {
        id: 1,
        email: loginAuthDto.email,
        userName: loginAuthDto.userName,
        password: 'hashedPassword',
        isActive: true,
        refreshToken: null,
        createAt: new Date(),
      };

      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
      };

      const bcryptHashMock = jest.fn().mockResolvedValue('hashedPassword');

      // mocking methods
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(bcryptHashMock);
      jest.spyOn(userRepository, 'save').mockResolvedValue(savedUser);
      jest.spyOn(service, 'getTokens').mockResolvedValue(tokens);
      jest.spyOn(service, 'updateRtHash').mockResolvedValue(undefined);

      const result = await service.register(loginAuthDto);
      expect(result).toEqual(tokens);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: loginAuthDto.email, userName: loginAuthDto.userName } });
      expect(userRepository.save).toHaveBeenCalledWith({ ...loginAuthDto, password: 'hashedPassword' });
      expect(service.getTokens).toHaveBeenCalledWith(savedUser.id, savedUser.email);
      expect(service.updateRtHash).toHaveBeenCalledWith(savedUser.id, tokens.refresh_token);
    })

    it('should not register user if user already exists', async () => {
      const loginAuthDto = {
        email: 'test@gmail.com',
        password: 'password',
        userName: 'testUser',
      }

      const savedUser: User = {
        id: 1,
        email: loginAuthDto.email,
        userName: 'testUser',
        password: 'hashedPassword',
        isActive: true,
        refreshToken: null,
        createAt: new Date(),
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(savedUser);

      await expect(service.register(loginAuthDto)).rejects.toThrow();
    })
  })
});
