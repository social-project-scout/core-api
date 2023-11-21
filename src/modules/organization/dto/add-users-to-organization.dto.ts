import { ArrayMinSize, IsUUID } from 'class-validator';

export class AddUsersToOrganizationDto {
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  userIds: string[];
}
