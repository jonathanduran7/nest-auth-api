import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/create-auth.dto';
import { RtGuard } from 'src/commons/guards';
import {
  GetCurrentUser,
  GetCurrentUserId,
  Public,
} from 'src/commons/decorators';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.CREATED)
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  register(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.register(loginAuthDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number) {
    return this.authService.logout(userId);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Put('update-password')
  @HttpCode(HttpStatus.OK)
  updatePassword(
    @GetCurrentUserId() userId: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const { password } = updatePasswordDto;

    return this.authService.updatePassword(userId, password);
  }
}
