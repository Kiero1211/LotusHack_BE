import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MatchPassword } from '../../../common/decorators/match-password.decorator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MatchPassword('password')
  confirmPassword: string;
}
