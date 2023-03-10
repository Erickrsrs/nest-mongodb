import { AuthService } from '../auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { SigninToken } from './models/signinToken.model';
import * as bcrypt from 'bcrypt';
import { User } from './models/users.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User')
    private readonly usersModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  public async signup(signupDto: SignupDto): Promise<User> {
    const user = new this.usersModel(signupDto);
    return user.save();
  }

  public async signin(signinDto: SigninDto): Promise<SigninToken> {
    const user = await this.findByEmail(signinDto.email);
    const match = await this.checkPassword(signinDto.password, user);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    const jwtToken = await this.authService.createAccessToken(user._id);
    return {
      name: user.name,
      jwtToken,
      email: user.email,
    };
  }

  public async findAll(): Promise<User[]> {
    return this.usersModel.find();
  }

  private async findByEmail(email: string): Promise<User> {
    const user = this.usersModel.findOne({ email });
    if (!user) throw new NotFoundException('Email not found');
    return user;
  }

  private async checkPassword(password: string, user: User): Promise<boolean> {
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Password is incorrect');
    return match;
  }
}
