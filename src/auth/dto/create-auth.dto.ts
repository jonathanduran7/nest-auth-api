import { IsEmail, IsNotEmpty, IsStrongPassword, Length } from "class-validator";

export class LoginAuthDto {

  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({
    minNumbers: 1,
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minSymbols: 0,
  })
  password: string;
}
