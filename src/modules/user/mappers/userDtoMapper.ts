import { User } from '@prisma/client';
import { removeFields } from 'src/helpers/utils/removeFields';

export const userDtoMapper = (user: User): Omit<User, 'password'> => {
  return removeFields(user, ['password']);
};
