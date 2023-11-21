import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../common/services/prisma.service';

import * as bcrypt from 'bcrypt';
import { PaginationOffsetParams } from 'src/helpers/types/PaginationOffset';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const checkEmail = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (checkEmail)
      throw new UnprocessableEntityException('Email already exists');

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await bcrypt.hash(createUserDto.password, 10),
      },
    });
  }

  async findAll({
    search,
    not,
    pagination: { limit, page, orderBy },
  }: {
    search?: string;
    not?: string;
    pagination: PaginationOffsetParams;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (not) {
      where.id = {
        not,
      };
    }

    const count = await this.prisma.user.count({
      where,
      orderBy,
    });

    const items = await this.prisma.user.findMany({
      where,
      skip: page * limit,
      take: limit,
      orderBy,
    });

    return {
      items,
      page,
      limit,
      total: count,
    };
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  findOneUsingData(search: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({
      where: search,
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto & {
      photo?: string;
    },
  ) {
    if (updateUserDto.email) {
      const checkEmail = await this.findOneUsingData({
        email: updateUserDto.email,
      });

      if (checkEmail)
        throw new UnprocessableEntityException('Email already exists');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}
