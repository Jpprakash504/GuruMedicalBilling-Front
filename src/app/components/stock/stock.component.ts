// stock.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {
  search = '';
  filterCategory = '';
  filterStock = '';
  showForm = signal(false);
  editMode = signal(false);
  showRestock = signal(false);
  restockMed = signal<any>(null);
  restockQty = 1;
  formError = signal('');
  editId: any = null;

  form = {
    name: '', genericName: '', category: '', manufacturer: '',
    batchNo: '', expiryDate: '', purchasePrice: 0, sellingPrice: 0,
    stock: 0, minStock: 10, unit: 'Strip', hsn: '3004', gst: 12
  };

  constructor(private data: DataService) {}

  async ngOnInit() {
    await this.data.loadMedicines();
  }

  categories = computed(() => [...new Set(this.data.getMedicines()().map((m: any) => m.category))]);

  filtered = computed(() => {
    let list = this.data.getMedicines()();
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter((m: any) =>
        m.name?.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.manufacturer?.toLowerCase().includes(q)
      );
    }
    if (this.filterCategory) list = list.filter((m: any) => m.category === this.filterCategory);
    if (this.filterStock === 'low') list = list.filter((m: any) => m.stock <= m.minStock);
    else if (this.filterStock === 'ok') list = list.filter((m: any) => m.stock > m.minStock);
    else if (this.filterStock === 'expiring') list = list.filter((m: any) => this.isExpiringSoon(m.expiryDate));
    return list;
  });

  isExpiringSoon(date: string): boolean {
    const exp = new Date(date);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return exp <= threeMonths;
  }

  openAdd() {
    this.editMode.set(false);
    this.form = { name: '', genericName: '', category: '', manufacturer: '', batchNo: '', expiryDate: '', purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 10, unit: 'Strip', hsn: '3004', gst: 12 };
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(med: any) {
    this.editMode.set(true);
    this.editId = med.id;
    this.form = { name: med.name, genericName: med.genericName, category: med.category, manufacturer: med.manufacturer, batchNo: med.batchNo, expiryDate: med.expiryDate, purchasePrice: med.purchasePrice, sellingPrice: med.sellingPrice, stock: med.stock, minStock: med.minStock, unit: med.unit, hsn: med.hsn, gst: med.gst };
    this.formError.set('');
    this.showForm.set(true);
  }

  async saveForm() {
    if (!this.form.name || !this.form.sellingPrice) { this.formError.set('Name and selling price are required'); return; }
    try {
      if (this.editMode()) {
        await this.data.updateMedicine({ ...this.form, id: this.editId });
      } else {
        await this.data.addMedicine(this.form);
      }
      this.closeForm();
    } catch (e) {
      this.formError.set('Error saving medicine. Try again!');
    }
  }

  closeForm() { this.showForm.set(false); }

  async deleteMed(id: any) {
    if (confirm('Delete this medicine?')) await this.data.deleteMedicine(id);
  }

  openRestock(med: any) { this.restockMed.set(med); this.restockQty = 1; this.showRestock.set(true); }

  async confirmRestock() {
    if (this.restockMed() && this.restockQty > 0) {
      await this.data.updateStock(this.restockMed()!.id, this.restockQty);
      this.showRestock.set(false);
    }
  }
}
