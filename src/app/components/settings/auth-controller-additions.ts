// =============================================
// Add these routes to auth.controller.ts (backend)
// File: src/modules/auth/auth.controller.ts
// =============================================

// Add these imports at top:
// import { Body, Put } from '@nestjs/common';

@UseGuards(AuthGuard('jwt'))
@Put('change-password')
changePassword(
  @Request() req,
  @Body() body: { currentPassword: string; newPassword: string }
) {
  return this.authService.changePassword(
    req.user.id,
    body.currentPassword,
    body.newPassword
  );
}

@UseGuards(AuthGuard('jwt'))
@Put('change-username')
changeUsername(
  @Request() req,
  @Body() body: { newUsername: string; currentPassword: string }
) {
  return this.authService.changeUsername(
    req.user.id,
    body.newUsername,
    body.currentPassword
  );
}

@UseGuards(AuthGuard('jwt'))
@Put('update-profile')
updateProfile(
  @Request() req,
  @Body() body: { name: string }
) {
  return this.authService.updateProfile(req.user.id, body.name);
}
