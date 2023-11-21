import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { CommonModule } from './modules/common/common.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [UserModule, CommonModule, AuthModule],
})
export class AppModule {}
