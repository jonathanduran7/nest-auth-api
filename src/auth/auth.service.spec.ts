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

  const loginAuthDto = {
    email: 'testing@gmail.com',
    userName: 'testUser',
    password: 'password',
  };

  const userSaved = {
    id: 1,
    email: loginAuthDto.email,
    userName: loginAuthDto.userName,
    password: 'hashedPassword',
    isActive: true,
    refreshToken: null,
    createAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
          },
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
  });

  describe('register', () => {
    it('should register user', async () => {
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
      };

      const bcryptHashMock = jest.fn().mockResolvedValue('hashedPassword');

      // mocking methods
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockImplementation(bcryptHashMock);
      jest.spyOn(userRepository, 'save').mockResolvedValue(userSaved);
      jest.spyOn(service, 'createTokens').mockResolvedValue(tokens);
      jest.spyOn(service, 'updateRtHash').mockResolvedValue(undefined);

      const result = await service.register(loginAuthDto);
      expect(result).toEqual(tokens);
      expect(userRepository.findOneBy).toHaveBeenCalledWith([
        { email: loginAuthDto.email },
        { userName: loginAuthDto.userName },
      ]);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...loginAuthDto,
        password: 'hashedPassword',
      });
      expect(service.createTokens).toHaveBeenCalledWith(
        userSaved.id,
        userSaved.email,
      );
      expect(service.updateRtHash).toHaveBeenCalledWith(
        userSaved.id,
        tokens.refresh_token,
      );
    });

    it('should not register user if user already exists', async () => {
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(userSaved);

      await expect(service.register(loginAuthDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
      };

      const bcryptCompareMock = jest.fn().mockResolvedValue(true);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userSaved);
      jest.spyOn(bcrypt, 'compare').mockImplementation(bcryptCompareMock);
      jest.spyOn(service, 'createTokens').mockResolvedValue(tokens);
      jest.spyOn(service, 'updateRtHash').mockResolvedValue(undefined);

      const result = await service.login(loginAuthDto);
      expect(result).toEqual(tokens);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginAuthDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginAuthDto.password,
        userSaved.password,
      );
    });

    it('should not login user if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginAuthDto)).rejects.toThrow();
    });

    it('should not login user if password does not match', async () => {
      const bcryptCompareMock = jest.fn().mockResolvedValue(false);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userSaved);
      jest.spyOn(bcrypt, 'compare').mockImplementation(bcryptCompareMock);

      await expect(service.login(loginAuthDto)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined);
      await service.logout(userSaved.id);
      expect(userRepository.update).toHaveBeenCalledWith(userSaved.id, {
        refreshToken: null,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
      };

      // if necessary that userSaved has refreshToken
      userSaved.refreshToken = 'hashedRefreshToken';

      const bcryptCompareMock = jest.fn().mockResolvedValue(true);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userSaved);

      jest.spyOn(bcrypt, 'compare').mockImplementation(bcryptCompareMock);
      jest.spyOn(service, 'createTokens').mockResolvedValue(tokens);
      jest.spyOn(service, 'updateRtHash').mockResolvedValue(undefined);

      const result = await service.refreshToken(userSaved.id, 'refresh_token');

      expect(result).toEqual(tokens);
    });

    it('should not refresh token if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.refreshToken(userSaved.id, 'refresh_token'),
      ).rejects.toThrow();
    });
  });

  describe('update password', () => {
    it('if password not match should throw error', async () => {
      const updatePasswordDto = {
        oldPassword: 'password',
        newPassword: 'newPassword',
      };
      const bcryptCompareMock = jest.fn().mockResolvedValue(false);
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(userSaved);
      jest.spyOn(bcrypt, 'compare').mockImplementation(bcryptCompareMock);
      await expect(
        service.updatePassword(
          userSaved.id,
          updatePasswordDto.newPassword,
          updatePasswordDto.oldPassword,
        ),
      ).rejects.toThrow();
    });

    it('should update password', async () => {
      const updatePasswordDto = {
        oldPassword: 'password',
        newPassword: 'newPassword',
      };

      // mocking methods
      const bcryptHashMock = jest.fn().mockResolvedValue('hashedPassword');
      const bcryptCompareMock = jest.fn().mockResolvedValue(true);

      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(userSaved);
      jest.spyOn(bcrypt, 'compare').mockImplementation(bcryptCompareMock);
      jest.spyOn(bcrypt, 'hash').mockImplementation(bcryptHashMock);

      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined);

      await service.updatePassword(
        userSaved.id,
        updatePasswordDto.newPassword,
        updatePasswordDto.oldPassword,
      );

      // assertions
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
        10,
      );

      expect(userRepository.update).toHaveBeenCalledWith(userSaved.id, {
        password: 'hashedPassword',
      });
    });
  });
});
