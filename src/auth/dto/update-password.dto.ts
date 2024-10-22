import { IsStrongPassword } from 'class-validator';

export class UpdatePasswordDto {
  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  newPassword: string;

  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  oldPassword: string;
}
