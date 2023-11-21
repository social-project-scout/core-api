import { Transform } from 'class-transformer';

import { IsBoolean, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsOptional()
  @IsBoolean()
  active = true;

  @IsNotEmpty()
  password: string;
}
