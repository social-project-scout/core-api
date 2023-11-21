import { Organization } from '@prisma/client';

export const organizationDtoMapper = (
  organization: Organization,
  admin = false,
): Organization => {
  if (!admin) {
    delete organization['createdBy'];
    delete organization['workers'];
  }

  return organization;
};
