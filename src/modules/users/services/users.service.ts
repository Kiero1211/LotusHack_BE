import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/users.repository';
import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string) {
    return this.userRepository.findById(id);
  }

  async create(data: any) {
    return this.userRepository.create(data);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.password) {
      throw new BadRequestException('OAuth users cannot change password');
    }

    const { currentPassword, newPassword } = changePasswordDto;

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await this.userRepository.updateById(userId, { password: hashedPassword });
    
    return { success: true, message: 'Password updated successfully' };
  }
}
