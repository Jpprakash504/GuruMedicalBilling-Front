// login.component.ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = signal('');
  loading = signal(false);
  showPass = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/']);
  }

  fillCreds(u: string, p: string) {
    this.username = u;
    this.password = p;
  }

  async login() {
    if (!this.username || !this.password) {
      this.error.set('Please enter username and password');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const ok = await this.auth.login(this.username, this.password);
    if (ok) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Invalid username or password. Make sure backend is running!');
      this.loading.set(false);
    }
  }
}
