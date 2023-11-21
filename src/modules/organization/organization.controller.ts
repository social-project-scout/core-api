import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthUser } from '../auth/entities/User';
import { ReqUser } from '../auth/strategies/jwt.strategy';
import { PaginationOffsetParams } from 'src/helpers/types/PaginationOffset';
import { ReqPagination } from 'src/helpers/decorators/Pagination.decorator';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/services/file.service';
import { organizationDtoMapper } from './mappers/organizationDtoMapper';
import { AddUsersToOrganizationDto } from './dto/add-users-to-organization.dto';

@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @ReqUser() user: AuthUser,
  ) {
    if (user.role !== 'admin') {
      delete createOrganizationDto.active;
    }

    return organizationDtoMapper(
      await this.organizationService.create({
        ...createOrganizationDto,
        createdById: user.id,
      }),
      user.role === 'admin',
    );
  }

  @Get()
  async findAll(
    @ReqPagination() pagination: PaginationOffsetParams,
    @ReqUser() user: AuthUser,
    @Query('search') search?: string,
    @Query('meWork') meWork?: boolean,
    @Query('meOwner') meOwner?: boolean,
  ) {
    const where: Prisma.OrganizationWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (meWork !== undefined) {
      where.workers = {
        some: {
          userId: {
            [meWork ? 'equals' : 'not']: user.id,
          },
        },
      };
    }

    if (meOwner) {
      where.createdById = user.id;
    }

    const data = await this.organizationService.findAll({
      pagination,
      where,
    });

    return {
      ...data,
      items: data.items.map((item) =>
        organizationDtoMapper(item, user.role === 'admin'),
      ),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @ReqUser() user: AuthUser) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organizationDtoMapper(organization, user.role === 'admin');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @ReqUser() user: AuthUser,
  ) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    if (user.role !== 'admin') {
      delete updateOrganizationDto.active;
    }

    const updatedOrganization = await this.organizationService.update(
      id,
      updateOrganizationDto,
    );

    return organizationDtoMapper(updatedOrganization, user.role === 'admin');
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @ReqUser() user: AuthUser) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    await this.organizationService.remove(id);

    return;
  }

  @Post('avatar/:id')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @ReqUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('File not uploaded');
    }

    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    const { originalname } = file;

    const location = `organization/${id}.${originalname.split('.').pop()}`;

    const fileUrl = await this.fileService.uploadFile({
      file,
      location,
    });

    const updatedOrganization = await this.organizationService.update(id, {
      photo: fileUrl,
    });

    return organizationDtoMapper(updatedOrganization, user.role === 'admin');
  }

  @Delete('avatar/:id')
  async deleteAvatar(@Param('id') id: string, @ReqUser() user: AuthUser) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    if (!organization.photo) {
      return organizationDtoMapper(organization, user.role === 'admin');
    }

    const location = `organization/${organization.photo.split('/').pop()}`;

    this.fileService.removeFile({
      location,
    });

    const updatedOrganization = await this.organizationService.update(id, {
      photo: null,
    });

    return organizationDtoMapper(updatedOrganization, user.role === 'admin');
  }

  @Post('add-users/:id')
  async addUsers(
    @Param('id') id: string,
    @ReqUser() user: AuthUser,
    @Body() body: AddUsersToOrganizationDto,
  ) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    await this.organizationService.addUsers({
      userIds: body.userIds,
      organizationId: id,
    });
  }

  @Delete('remove-users/:id')
  async removeUsers(
    @Param('id') id: string,
    @ReqUser() user: AuthUser,
    @Body() body: AddUsersToOrganizationDto,
  ) {
    const organization = await this.organizationService.findById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (organization.createdById !== user.id && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You are not authorized to update this organization!',
      );
    }

    await this.organizationService.removeUsers({
      userIds: body.userIds,
      organizationId: id,
    });
  }
}
