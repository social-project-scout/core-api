import { Prisma } from '@prisma/client';

export type OrderBy = {
  [field: string]: Prisma.SortOrder;
};
