import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environment';

// export const API_URL = 'http://localhost:3000/api';
export const API_URL =environment.apiUrl

@Injectable({ providedIn: 'root' })
export class DataService {

  private _medicines = signal<any[]>([]);
  private _bills = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('medishop_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ─── MEDICINES ───────────────────────────────────
  getMedicines() { return this._medicines; }

  async loadMedicines(search?: string, category?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    const data = await firstValueFrom(
      this.http.get<any[]>(`${API_URL}/medicines`, { headers: this.headers(), params })
    );
    this._medicines.set(data);
    return data;
  }

  async addMedicine(med: any) {
    const data = await firstValueFrom(
      this.http.post<any>(`${API_URL}/medicines`, med, { headers: this.headers() })
    );
    await this.loadMedicines();
    return data;
  }

  async updateMedicine(med: any) {
    const data = await firstValueFrom(
      this.http.put<any>(`${API_URL}/medicines/${med.id}`, med, { headers: this.headers() })
    );
    await this.loadMedicines();
    return data;
  }

  async deleteMedicine(id: any) {
    await firstValueFrom(
      this.http.delete(`${API_URL}/medicines/${id}`, { headers: this.headers() })
    );
    await this.loadMedicines();
  }

  async updateStock(id: any, qty: number) {
    const data = await firstValueFrom(
      this.http.put<any>(`${API_URL}/medicines/${id}/stock`, { quantity: Math.abs(qty), type: qty > 0 ? 'add' : 'subtract' }, { headers: this.headers() })
    );
    await this.loadMedicines();
    return data;
  }

  searchMedicines(query: string): any[] {
    if (!query) return this._medicines();
    const q = query.toLowerCase();
    return this._medicines().filter((m: any) =>
      m.name?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q) ||
      m.manufacturer?.toLowerCase().includes(q)
    );
  }

  getLowStockMedicines(): any[] {
    return this._medicines().filter((m: any) => m.stock <= m.minStock);
  }

  getExpiringMedicines(): any[] {
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return this._medicines().filter((m: any) => new Date(m.expiryDate) <= threeMonths);
  }

  // ─── BILLS ───────────────────────────────────────
  getBills() { return this._bills; }

  async loadBills(search?: string, from?: string, to?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    const data = await firstValueFrom(
      this.http.get<any[]>(`${API_URL}/bills`, { headers: this.headers(), params })
    );
    this._bills.set(data);
    return data;
  }

  async addBill(bill: any) {
    const payload = {
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      doctorName: bill.doctorName,
      paymentMode: bill.paymentMode,
      subtotal: bill.subtotal,
      totalDiscount: bill.totalDiscount,
      totalGst: bill.totalGst,
      grandTotal: bill.grandTotal,
      items: bill.items.map((i: any) => ({
        medicineId: i.medicine.id,
        medicineName: i.medicine.name,
        quantity: i.quantity,
        rate: i.medicine.sellingPrice,
        discount: i.discount,
        gst: i.medicine.gst,
        total: i.total,
      }))
    };
    const data = await firstValueFrom(
      this.http.post<any>(`${API_URL}/bills`, payload, { headers: this.headers() })
    );
    await this.loadBills();
    await this.loadMedicines();
    return data;
  }

  // ─── DASHBOARD STATS ─────────────────────────────
  async getDashboardStats() {
    const today = await firstValueFrom(
      this.http.get<any>(`${API_URL}/bills/stats/today`, { headers: this.headers() })
    );
    return {
      todaySales: today.total || 0,
      todayBills: today.count || 0,
      lowStockCount: this.getLowStockMedicines().length,
      expiringCount: this.getExpiringMedicines().length,
      monthSales: 0,
      totalMedicines: this._medicines().length,
    };
  }

  async getMonthlySalesData() {
    const data = await firstValueFrom(
      this.http.get<any[]>(`${API_URL}/bills/stats/monthly`, { headers: this.headers() })
    );
    return data.map((d: any) => ({
      month: d.month?.substring(5) || d.month,
      sales: parseFloat(d.total) || 0
    }));
  }

  async getCategoryData() {
    const cats: Record<string, { count: number; value: number }> = {};
    this._medicines().forEach((m: any) => {
      if (!cats[m.category]) cats[m.category] = { count: 0, value: 0 };
      cats[m.category].count += m.stock;
      cats[m.category].value += m.stock * m.sellingPrice;
    });
    return Object.entries(cats).map(([category, d]) => ({ category, ...d }));
  }
}
