// settings.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { API_URL } from '../../services/data.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  // Profile
  newName = '';
  nameSaving = signal(false);
  nameSuccess = signal('');
  nameError = signal('');

  // Username
  newUsername = '';
  confirmPassForUsername = '';
  showPassUser = signal(false);
  usernameSaving = signal(false);
  usernameSuccess = signal('');
  usernameError = signal('');

  // Password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPass = signal(false);
  showNewPass = signal(false);
  showConfirmPass = signal(false);
  passSaving = signal(false);
  passSuccess = signal('');
  passError = signal('');

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    const user = this.currentUser();
    if (user) this.newName = user.name;
  }

  currentUser() { return this.auth.getUser()(); }

  userInitials() {
    return this.currentUser()?.name
      .split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('medishop_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── Password Strength ──────────────────────
  strengthPct = computed(() => {
    const p = this.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score += 25;
    if (p.length >= 10) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9!@#$%^&*]/.test(p)) score += 25;
    return score;
  });

  strengthText = computed(() => {
    const pct = this.strengthPct();
    if (pct <= 25) return 'Weak';
    if (pct <= 50) return 'Medium';
    return 'Strong';
  });

  strengthClass = computed(() => {
    const pct = this.strengthPct();
    if (pct <= 25) return 'weak';
    if (pct <= 50) return 'medium';
    return 'strong';
  });

  // ─── Update Name ────────────────────────────
  async updateName() {
    if (!this.newName.trim()) return;
    this.nameSaving.set(true);
    this.nameSuccess.set('');
    this.nameError.set('');
    try {
      const res: any = await firstValueFrom(
        this.http.put(`${API_URL}/auth/update-profile`,
          { name: this.newName },
          { headers: this.headers() }
        )
      );
      // Update local storage
      const user = this.currentUser();
      if (user) {
        const updated = { ...user, name: this.newName };
        localStorage.setItem('medishop_user', JSON.stringify(updated));
        this.auth.getUser().set(updated);
      }
      this.nameSuccess.set('Display name updated successfully!');
      setTimeout(() => this.nameSuccess.set(''), 3000);
    } catch (e: any) {
      this.nameError.set(e?.error?.message || 'Failed to update name');
      setTimeout(() => this.nameError.set(''), 3000);
    } finally {
      this.nameSaving.set(false);
    }
  }

  // ─── Change Username ─────────────────────────
  async changeUsername() {
    if (!this.newUsername || !this.confirmPassForUsername) return;
    this.usernameSaving.set(true);
    this.usernameSuccess.set('');
    this.usernameError.set('');
    try {
      await firstValueFrom(
        this.http.put(`${API_URL}/auth/change-username`,
          { newUsername: this.newUsername, currentPassword: this.confirmPassForUsername },
          { headers: this.headers() }
        )
      );
      // Update local storage
      const user = this.currentUser();
      if (user) {
        const updated = { ...user, username: this.newUsername };
        localStorage.setItem('medishop_user', JSON.stringify(updated));
        this.auth.getUser().set(updated);
      }
      this.usernameSuccess.set('Username changed successfully!');
      this.newUsername = '';
      this.confirmPassForUsername = '';
      setTimeout(() => this.usernameSuccess.set(''), 3000);
    } catch (e: any) {
      this.usernameError.set(e?.error?.message || 'Failed to change username');
      setTimeout(() => this.usernameError.set(''), 3000);
    } finally {
      this.usernameSaving.set(false);
    }
  }

  // ─── Change Password ─────────────────────────
  async changePassword() {
    if (!this.currentPassword || !this.newPassword) return;
    if (this.newPassword !== this.confirmPassword) return;
    if (this.newPassword.length < 6) {
      this.passError.set('Password must be at least 6 characters');
      return;
    }

    this.passSaving.set(true);
    this.passSuccess.set('');
    this.passError.set('');
    try {
      await firstValueFrom(
        this.http.put(`${API_URL}/auth/change-password`,
          { currentPassword: this.currentPassword, newPassword: this.newPassword },
          { headers: this.headers() }
        )
      );
      this.passSuccess.set('Password changed successfully! Please login again.');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      // Logout after password change
      setTimeout(() => {
        this.auth.logout();
        window.location.href = '/login';
      }, 2000);
    } catch (e: any) {
      this.passError.set(e?.error?.message || 'Current password is incorrect');
      setTimeout(() => this.passError.set(''), 4000);
    } finally {
      this.passSaving.set(false);
    }
  }
}
