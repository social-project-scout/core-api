import { Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { FileService } from './services/file.service';

@Module({
  providers: [PrismaService, FileService],
  exports: [PrismaService, FileService],
})
export class CommonModule {}
