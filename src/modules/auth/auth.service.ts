import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(user: User) {
    const payload = { sub: user.id, email: user.email };

    return {
      active: user.active,
      token: this.jwtService.sign(payload),
    };
  }

  async signUp(CreateUserDto: CreateUserDto) {
    const user = await this.userService.create(CreateUserDto);

    return {
      active: user.active,
      token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }

  async validateUser(email: string, checkPassword: string) {
    const user = await this.userService.findOneUsingData({
      email: email.toLowerCase(),
    });

    if (user) {
      const isMatch = await bcrypt.compare(checkPassword, user.password);

      if (isMatch) {
        delete user.password;

        return user;
      }
    }

    return null;
  }
}
