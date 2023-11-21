import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PrismaService } from '../common/services/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationOffsetParams } from 'src/helpers/types/PaginationOffset';
import { AddUsersToOrganizationDto } from './dto/add-users-to-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  defaultInclude = {
    createdBy: true,
    workers: {
      include: {
        user: true,
      },
    },
  };

  create(
    createOrganizationDto: CreateOrganizationDto & {
      createdById: string;
    },
  ) {
    return this.prisma.organization.create({
      data: createOrganizationDto,
      include: this.defaultInclude,
    });
  }

  async findAll({
    where = {},
    pagination: { limit, page, orderBy },
  }: {
    where?: Prisma.OrganizationWhereInput;
    pagination: PaginationOffsetParams;
  }) {
    const count = await this.prisma.organization.count({
      where,
      orderBy,
    });

    const items = await this.prisma.organization.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy,
      include: this.defaultInclude,
    });

    return {
      items,
      page,
      limit,
      total: count,
    };
  }

  async findById(id: string) {
    const data = await this.prisma.organization.findUnique({
      where: {
        id,
      },
      include: this.defaultInclude,
    });

    return data;
  }

  findOne(search?: Prisma.OrganizationWhereInput) {
    return this.prisma.organization.findFirst({
      where: search,
      include: this.defaultInclude,
    });
  }

  update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto & {
      photo?: string;
    },
  ) {
    return this.prisma.organization.update({
      where: {
        id,
      },
      data: updateOrganizationDto,
      include: this.defaultInclude,
    });
  }

  remove(id: string) {
    return this.prisma.organization.delete({
      where: {
        id: id,
      },
    });
  }

  async addUsers({
    userIds,
    organizationId,
  }: {
    userIds: AddUsersToOrganizationDto['userIds'];
    organizationId: string;
  }) {
    await this.prisma.managersOnOrganization.createMany({
      data: userIds.map((userId) => ({
        userId,
        organizationId,
      })),
      skipDuplicates: true,
    });
  }

  async removeUsers({
    userIds,
    organizationId,
  }: {
    userIds: AddUsersToOrganizationDto['userIds'];
    organizationId: string;
  }) {
    await this.prisma.managersOnOrganization.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
        organizationId,
      },
    });
  }
}
