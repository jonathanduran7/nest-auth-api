import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LoginAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  login(loginAuthDto: LoginAuthDto) {
    return 'This action is login auth';
  }

  async register(loginAuthDto: LoginAuthDto) {
    const existUser = await this.usersRepository.find({ where: { email: loginAuthDto.email } })
    if (existUser) {
      return 'User already exists';
    }

    await this.usersRepository.save(loginAuthDto);
    return 'This action is register auth';
  }
}
