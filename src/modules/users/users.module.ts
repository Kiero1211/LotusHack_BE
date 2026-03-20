import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controller/users.controller';
import { UserRepository } from './repositories/users.repository';
import { User, UserSchema } from './schema/user.schema';
import { UsersService } from './services/users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UserRepository, UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
