// reports.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  loading = signal(true);
  allBills = signal<any[]>([]);
  salesData = signal<any[]>([]);
  categoryData = signal<any[]>([]);
  paymentData = signal<any[]>([]);
  topMedicines = signal<any[]>([]);
  totalRevenue = signal(0);
  totalBills = signal(0);
  avgBill = signal(0);
  stockValue = signal(0);
  maxSales = signal(0);
  maxCatValue = signal(0);

  constructor(private data: DataService) {}

  async ngOnInit() {
    try {
      await this.data.loadMedicines();
      await this.data.loadBills();

      const bills = this.data.getBills()();
      this.allBills.set(bills);

      // Revenue stats
      const paid = bills.filter((b: any) => b.status === 'paid');
      const rev = paid.reduce((s: number, b: any) => s + parseFloat(b.grandTotal), 0);
      this.totalRevenue.set(rev);
      this.totalBills.set(paid.length);
      this.avgBill.set(paid.length > 0 ? rev / paid.length : 0);

      // Stock value
      const sv = this.data.getMedicines()().reduce((s: number, m: any) => s + m.stock * m.sellingPrice, 0);
      this.stockValue.set(sv);

      // Monthly sales
      const monthly = await this.data.getMonthlySalesData();
      this.salesData.set(monthly);
      this.maxSales.set(monthly.length > 0 ? Math.max(...monthly.map((d: any) => d.sales)) : 0);

      // Category data
      const cats = await this.data.getCategoryData();
      const sortedCats = cats.sort((a: any, b: any) => b.value - a.value);
      this.categoryData.set(sortedCats);
      this.maxCatValue.set(sortedCats.length > 0 ? Math.max(...sortedCats.map((d: any) => d.value)) : 0);

      // Payment breakdown
      const colors: Record<string, string> = { cash: '#16a34a', card: '#2563eb', upi: '#7c3aed' };
      const pmMap: Record<string, number> = {};
      paid.forEach((b: any) => {
        pmMap[b.paymentMode] = (pmMap[b.paymentMode] || 0) + parseFloat(b.grandTotal);
      });
      this.paymentData.set(
        Object.entries(pmMap).map(([mode, amount]) => ({
          mode, amount,
          pct: rev > 0 ? (amount / rev) * 100 : 0,
          color: colors[mode] || '#64748b'
        }))
      );

      // Top medicines from bills
      const medMap: Record<string, any> = {};
      bills.forEach((b: any) => {
        (b.items || []).forEach((item: any) => {
          const name = item.medicineName || item.medicine?.name;
          if (!name) return;
          if (!medMap[name]) medMap[name] = { name, qty: 0, revenue: 0 };
          medMap[name].qty += item.quantity;
          medMap[name].revenue += parseFloat(item.total);
        });
      });
      this.topMedicines.set(
        Object.values(medMap).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5)
      );

    } catch (e) {
      console.error('Reports error:', e);
    } finally {
      this.loading.set(false);
    }
  }
}
