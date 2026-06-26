// change-password.dto.ts
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsString() @IsNotEmpty()
  currentPassword: string;

  @IsString() @MinLength(6)
  newPassword: string;
}

export class ChangeUsernameDto {
  @IsString() @IsNotEmpty()
  newUsername: string;

  @IsString() @IsNotEmpty()
  currentPassword: string;
}

export class UpdateProfileDto {
  @IsString() @IsNotEmpty()
  name: string;
}
