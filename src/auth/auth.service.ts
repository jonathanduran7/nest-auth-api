import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async login(loginAuthDto: LoginAuthDto) {
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email } })
    if (!existUser) {
      return 'User not found';
    }

    const isPasswordMatch = await bcrypt.compare(loginAuthDto.password, existUser.password);

    if (!isPasswordMatch) {
      return 'Password not match';
    }

    return 'This action is login auth';
  }

  async register(loginAuthDto: LoginAuthDto) {
    const existUser = await this.usersRepository.findOne({ where: { email: loginAuthDto.email, userName: loginAuthDto.userName } })
    if (existUser) {
      return 'User already exists';
    }

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(loginAuthDto.password, saltOrRounds);
    loginAuthDto.password = hash;

    await this.usersRepository.save(loginAuthDto);
    return 'This action is register auth';
  }
}
