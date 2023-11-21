import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  active: string;
}
