import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './data.service';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'pharmacist';
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('medishop_user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string; user: User }>(`${API_URL}/auth/login`, { username, password })
      );
      localStorage.setItem('medishop_token', res.token);
      localStorage.setItem('medishop_user', JSON.stringify(res.user));
      this.currentUser.set(res.user);
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('medishop_token');
    localStorage.removeItem('medishop_user');
  }

  getUser() { return this.currentUser; }

  isLoggedIn(): boolean {
    if (this.currentUser()) return true;
    const stored = localStorage.getItem('medishop_user');
    if (stored) { this.currentUser.set(JSON.parse(stored)); return true; }
    return false;
  }
}
