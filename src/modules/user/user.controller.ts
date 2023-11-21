import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userDtoMapper } from './mappers/userDtoMapper';
import { PaginationOffsetParams } from 'src/helpers/types/PaginationOffset';
import { ReqPagination } from 'src/helpers/decorators/Pagination.decorator';
import { ReqUser } from '../auth/strategies/jwt.strategy';
import { AuthUser } from '../auth/entities/User';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/services/file.service';
import { Prisma } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @ReqUser() user: AuthUser,
  ) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('You are not authorized to create users');
    }

    return userDtoMapper(await this.userService.create(createUserDto));
  }

  @Get()
  async findAll(
    @ReqUser() user: AuthUser,
    @ReqPagination() pagination: PaginationOffsetParams,
    @Query('search') search?: string,
  ) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('You are not authorized to list users');
    }

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

    where.id = {
      not: user.id,
    };

    const data = await this.userService.findAll({
      pagination,
      where,
    });

    return {
      ...data,
      items: data.items.map(userDtoMapper),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @ReqUser() user: AuthUser) {
    const userId = id === 'me' ? user.id : id;

    if (user.role !== 'admin' && userId !== user.id) {
      throw new UnauthorizedException('You are not authorized to get user');
    }

    const checkUser = await this.userService.findById(userId);

    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    return userDtoMapper(checkUser);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @ReqUser() user: AuthUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = id === 'me' ? user.id : id;

    if (user.role !== 'admin' && userId !== user.id) {
      throw new UnauthorizedException('You are not authorized to update user');
    }

    const checkUser = await this.userService.findById(userId);

    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'admin') {
      delete updateUserDto.active;
    }

    if (updateUserDto.email && updateUserDto.email === checkUser.email) {
      delete updateUserDto.email;
    }

    const updatedUser = await this.userService.update(userId, updateUserDto);

    return userDtoMapper(updatedUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @ReqUser() user: AuthUser) {
    if (user.role !== 'admin') {
      throw new UnauthorizedException('You are not authorized to delete user');
    }

    const checkUser = await this.userService.findOneUsingData({
      id,
    });

    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    await this.userService.remove(checkUser.id);

    return;
  }

  @Post('avatar/:id')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @ReqUser() user: AuthUser,
  ) {
    const userId = id === 'me' ? user.id : id;

    if (!file) {
      throw new BadRequestException('File not uploaded');
    }

    const checkUser = await this.userService.findOneUsingData({
      id: userId,
    });

    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    const { originalname } = file;

    const location = `user/${userId}.${originalname.split('.').pop()}`;

    const fileUrl = await this.fileService.uploadFile({
      file,
      location,
    });

    return this.userService.update(userId, {
      photo: fileUrl,
    });
  }

  @Delete('avatar/:id')
  async deleteAvatar(@Param('id') id: string, @ReqUser() user: AuthUser) {
    const userId = id === 'me' ? user.id : id;

    if (user.role !== 'admin' && userId !== user.id) {
      throw new UnauthorizedException(
        "You are not authorized to delete user's avatar.",
      );
    }

    const checkUser = await this.userService.findById(userId);

    if (!checkUser) {
      throw new NotFoundException('User not found');
    }

    if (!checkUser.photo) {
      return userDtoMapper(checkUser);
    }

    const location = `user/${checkUser.photo.split('/').pop()}`;

    this.fileService.removeFile({
      location,
    });

    return this.userService.update(userId, {
      photo: null,
    });
  }
}
