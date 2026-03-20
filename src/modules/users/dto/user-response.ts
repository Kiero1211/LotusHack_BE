import { Expose, Transform } from 'class-transformer';
import { type IUserRole } from 'src/common/constants/auth';

export class UserResponseDto {
  @Expose({ name: 'id' })
  @Transform(({ obj }: { obj: { _id: { toString: () => string } } }) => obj._id.toString())
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  avatar: string;

  @Expose()
  role: IUserRole;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  @Transform(({ obj }: { obj: { password?: string } }) => !!obj.password)
  hasPassword: boolean;
}
