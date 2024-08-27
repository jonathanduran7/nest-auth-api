import { PartialType } from '@nestjs/mapped-types';
import { LoginAuthDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(LoginAuthDto) { }
