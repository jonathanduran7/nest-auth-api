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
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async login(loginAuthDto: LoginAuthDto): Promise<Tokens> {
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email } })
    if (!existUser) {
      throw new UnauthorizedException();
    }

    const isPasswordMatch = await bcrypt.compare(loginAuthDto.password, existUser.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException();
    }

    const tokens = await this.getTokens(existUser.id, existUser.email);

    return tokens;
  }

  async register(loginAuthDto: LoginAuthDto): Promise<Tokens> {
    console.log(loginAuthDto)
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email, userName: loginAuthDto.userName } })

    console.log(existUser)
    if (existUser) {
      throw new UnauthorizedException();
    }

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(loginAuthDto.password, saltOrRounds);
    loginAuthDto.password = hash;

    const userRegistered = await this.usersRepository.save(loginAuthDto);

    console.log(userRegistered)
    const tokens = await this.getTokens(userRegistered.id, userRegistered.email);
    return tokens;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    const payload = await this.jwtService.verifyAsync(refreshToken);
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync({
        sub: userId,
        email
      }, {
        secret: 'at-secret',
        expiresIn: 60 * 15
      }),
      this.jwtService.signAsync({
        sub: userId,
        email
      }, {
        secret: 'rt-secret',
        expiresIn: 60 * 60 * 24 * 30
      })
    ])

    return {
      access_token: at,
      refresh_token: rt
    }
  }
}
