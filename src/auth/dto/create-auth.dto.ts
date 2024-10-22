import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty()
  userName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  password: string;
}
