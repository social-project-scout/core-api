import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from './guards/public.guard';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('signIn')
  @Public()
  async signIn(@Req() req: any) {
    const { active, token } = await this.authService.signIn(req.user);

    if (!active) {
      throw new UnauthorizedException('User is not active');
    }

    return {
      token,
    };
  }

  @Post('signUp')
  @Public()
  async signIsignUp(@Body() CreateUserDto: CreateUserDto) {
    delete (CreateUserDto as CreateUserDto).active;

    return this.authService.signUp(CreateUserDto);
  }
}
