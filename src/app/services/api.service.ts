import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environment';

// export const API_URL = 'http://localhost:3000/api'; // Change to your server URL in production
export const API_URL =environment.apiUrl

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('medishop_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── AUTH ───────────────────────────────────────────
  login(username: string, password: string): Observable<{ token: string; user: any }> {
    return this.http.post<any>(`${API_URL}/auth/login`, { username, password }).pipe(
      tap(res => localStorage.setItem('medishop_token', res.token))
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${API_URL}/auth/profile`, { headers: this.headers() });
  }

  // ─── MEDICINES ──────────────────────────────────────
  getMedicines(search?: string, category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<any[]>(`${API_URL}/medicines`, { headers: this.headers(), params });
  }

  getMedicine(id: number): Observable<any> {
    return this.http.get(`${API_URL}/medicines/${id}`, { headers: this.headers() });
  }

  createMedicine(data: any): Observable<any> {
    return this.http.post(`${API_URL}/medicines`, data, { headers: this.headers() });
  }

  updateMedicine(id: number, data: any): Observable<any> {
    return this.http.put(`${API_URL}/medicines/${id}`, data, { headers: this.headers() });
  }

  updateStock(id: number, quantity: number, type: 'add' | 'subtract'): Observable<any> {
    return this.http.put(`${API_URL}/medicines/${id}/stock`, { quantity, type }, { headers: this.headers() });
  }

  deleteMedicine(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/medicines/${id}`, { headers: this.headers() });
  }

  getLowStock(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/medicines/low-stock`, { headers: this.headers() });
  }

  getExpiringMedicines(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/medicines/expiring-soon`, { headers: this.headers() });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/medicines/categories`, { headers: this.headers() });
  }

  // ─── BILLS ──────────────────────────────────────────
  getBills(search?: string, from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${API_URL}/bills`, { headers: this.headers(), params });
  }

  getBill(id: number): Observable<any> {
    return this.http.get(`${API_URL}/bills/${id}`, { headers: this.headers() });
  }

  createBill(data: any): Observable<any> {
    return this.http.post(`${API_URL}/bills`, data, { headers: this.headers() });
  }

  // ─── REPORTS / STATS ────────────────────────────────
  getTodayStats(): Observable<{ count: number; total: number }> {
    return this.http.get<any>(`${API_URL}/bills/stats/today`, { headers: this.headers() });
  }

  getMonthlyStats(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/bills/stats/monthly`, { headers: this.headers() });
  }

  getPaymentBreakdown(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/bills/stats/payment-breakdown`, { headers: this.headers() });
  }

  getTopMedicines(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/bills/stats/top-medicines`, { headers: this.headers() });
  }
}
