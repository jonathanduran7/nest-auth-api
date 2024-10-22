import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async login(loginAuthDto: LoginAuthDto): Promise<Tokens> {
    const existUser = await this.usersRepository.findOne({
      where: { email: loginAuthDto.email },
    });
    if (!existUser) {
      throw new UnauthorizedException();
    }

    const isPasswordMatch = await bcrypt.compare(
      loginAuthDto.password,
      existUser.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException();
    }

    return this.getTokens(existUser);
  }

  async register(loginAuthDto: LoginAuthDto): Promise<Tokens> {
    const existUser = await this.usersRepository.findOneBy([
      { email: loginAuthDto.email },
      { userName: loginAuthDto.userName },
    ]);

    if (existUser) {
      throw new UnauthorizedException();
    }

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(loginAuthDto.password, saltOrRounds);
    loginAuthDto.password = hash;

    const userRegistered = await this.usersRepository.save(loginAuthDto);

    return this.getTokens(userRegistered);
  }

  async logout(userId: number, token: string) {
    const tokenInCache = await this.cacheManager.get(token);

    if (tokenInCache) {
      throw new UnauthorizedException();
    }

    const halfHour = 30 * 60 * 1000;

    await this.cacheManager.set(token, 'revoked', halfHour);
    await this.usersRepository.update(userId, { refreshToken: null });
  }

  async refreshToken(userId: number, rt: string): Promise<Tokens> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isRtMatch = await bcrypt.compare(rt, user.refreshToken);

    if (!isRtMatch) {
      throw new UnauthorizedException();
    }

    return this.getTokens(user);
  }

  async createTokens(userId: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: 'at-secret',
          expiresIn: 60 * 15,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: 'rt-secret',
          expiresIn: 60 * 60 * 24 * 30,
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.usersRepository.update(userId, { refreshToken: hash });
  }

  async getTokens(user: User): Promise<Tokens> {
    const tokens = await this.createTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async updatePassword(
    userId: number,
    newPassword: string,
    oldPassword: string,
  ) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltOrRounds);

    const user = await this.usersRepository.findOneBy({ id: userId });
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException({ message: 'Old password is incorrect' });
    }

    await this.usersRepository.update(userId, { password: hash });
  }
}
