// medicine-search.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-medicine-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-search.component.html',
  styleUrls: ['./medicine-search.component.css']
})
export class MedicineSearchComponent implements OnInit {
  query = '';
  results = signal<any[]>([]);
  selected = signal<any>(null);
  activeCategory = signal('');

  constructor(private data: DataService) {}

  async ngOnInit() {
    await this.data.loadMedicines();
  }

  allMeds = computed(() => this.data.getMedicines()());
  categories = computed(() => [...new Set(this.data.getMedicines()().map((m: any) => m.category))]);

  onSearch() {
    this.activeCategory.set('');
    if (!this.query) { this.results.set([]); return; }
    this.results.set(this.data.searchMedicines(this.query));
  }

  clearSearch() {
    this.query = '';
    this.results.set([]);
    this.activeCategory.set('');
  }

  filterByCategory(cat: string) {
    if (this.activeCategory() === cat) {
      this.activeCategory.set('');
      this.results.set([]);
      return;
    }
    this.activeCategory.set(cat);
    this.query = '';
    this.results.set(this.data.getMedicines()().filter((m: any) => m.category === cat));
  }

  isExpiring(date: string): boolean {
    if (!date) return false;
    const exp = new Date(date);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return exp <= threeMonths;
  }
}
