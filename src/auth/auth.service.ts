import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private jwtService: JwtService,
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

  async logout(userId: number) {
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

  async updatePassword(userId: number, password: string) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    await this.usersRepository.update(userId, { password: hash });
  }
}
