// dashboard.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<any>({ todaySales: 0, todayBills: 0, lowStockCount: 0, expiringCount: 0, monthSales: 0, totalMedicines: 0 });
  recentBills = signal<any[]>([]);
  lowStock = signal<any[]>([]);
  expiring = signal<any[]>([]);
  salesData = signal<any[]>([]);
  maxSales = signal(0);

  constructor(private data: DataService) {}

  async ngOnInit() {
    try {
      await this.data.loadMedicines();
      await this.data.loadBills();

      const s = await this.data.getDashboardStats();
      this.stats.set(s);
      this.recentBills.set(this.data.getBills()().slice(0, 5));
      this.lowStock.set(this.data.getLowStockMedicines().slice(0, 3));
      this.expiring.set(this.data.getExpiringMedicines().slice(0, 2));

      const monthly = await this.data.getMonthlySalesData();
      this.salesData.set(monthly);
      this.maxSales.set(monthly.length > 0 ? Math.max(...monthly.map((d: any) => d.sales)) : 0);
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      this.loading.set(false);
    }
  }
}
