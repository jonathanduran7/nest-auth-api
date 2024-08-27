import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async login(loginAuthDto: LoginAuthDto): Promise<{ access_token: string }> {
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email } })
    if (!existUser) {
      throw new UnauthorizedException();
    }

    const isPasswordMatch = await bcrypt.compare(loginAuthDto.password, existUser.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException();
    }

    const payload = { email: loginAuthDto.email, sub: existUser.id };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(loginAuthDto: LoginAuthDto): Promise<{ access_token: string }> {
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email, userName: loginAuthDto.userName } })

    if (existUser) {
      throw new UnauthorizedException();
    }

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(loginAuthDto.password, saltOrRounds);
    loginAuthDto.password = hash;

    const userRegistered = await this.usersRepository.save(loginAuthDto);
    const payload = { email: loginAuthDto.email, sub: userRegistered.id };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
