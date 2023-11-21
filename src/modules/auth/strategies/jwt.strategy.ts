import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../entities/User';

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.sub as string);

    if (!user) {
      throw new UnauthorizedException('Token is invalid');
    }

    delete user.password;

    return user as AuthUser;
  }
}

export const ReqUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ...request.user,
    } as AuthUser;
  },
);
