import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  newPassword: string;

  @ApiProperty()
  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  oldPassword: string;
}
