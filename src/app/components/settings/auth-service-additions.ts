// =============================================
// Add these methods to auth.service.ts (backend)
// File: src/modules/auth/auth.service.ts
// =============================================

// Add these imports at top if not already there:
// import { BadRequestException, NotFoundException } from '@nestjs/common';

async changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new BadRequestException('Current password is incorrect');

  // Hash new password
  const hashed = await bcrypt.hash(newPassword, 10);
  await this.userRepo.update(userId, { password: hashed });

  return { message: 'Password changed successfully' };
}

async changeUsername(userId: number, newUsername: string, currentPassword: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new BadRequestException('Current password is incorrect');

  // Check if username already taken
  const exists = await this.userRepo.findOne({ where: { username: newUsername } });
  if (exists && exists.id !== userId) throw new BadRequestException('Username already taken');

  await this.userRepo.update(userId, { username: newUsername });
  return { message: 'Username changed successfully' };
}

async updateProfile(userId: number, name: string) {
  await this.userRepo.update(userId, { name });
  return this.getProfile(userId);
}
