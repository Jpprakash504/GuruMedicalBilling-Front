// billing.component.ts - COMPLETE FILE WITH PDF SUPPORT
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent {
  viewBills = signal(false);
  billSearch = '';
  customerName = '';
  customerPhone = '';
  doctorName = '';
  paymentMode: 'cash' | 'card' | 'upi' = 'cash';
  medSearch = '';
  addQty = 1;
  addDiscount = 0;
  selectedMed = signal<any>(null);
  searchResults = signal<any[]>([]);
  items = signal<any[]>([]);
  savedBill = signal<any>(null);
  saving = signal(false);
  sharing = signal(false);

  constructor(
    private data: DataService,
    private pdfService: PdfService
  ) {
    this.data.loadBills();
    this.data.loadMedicines();
  }

  filteredBills = computed(() =>
    this.data.getBills()().filter((b: any) =>
      !this.billSearch ||
      b.billNo?.toLowerCase().includes(this.billSearch.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(this.billSearch.toLowerCase())
    )
  );

  subtotal = computed(() =>
    this.items().reduce((s: number, i: any) => s + i.medicine.sellingPrice * i.quantity, 0)
  );
  totalDiscount = computed(() =>
    this.items().reduce((s: number, i: any) =>
      s + (i.medicine.sellingPrice * i.quantity * i.discount / 100), 0)
  );
  totalGst = computed(() =>
    this.items().reduce((s: number, i: any) => {
      const afterDisc = i.medicine.sellingPrice * i.quantity * (1 - i.discount / 100);
      return s + afterDisc * i.medicine.gst / 100;
    }, 0)
  );
  grandTotal = computed(() => this.subtotal() - this.totalDiscount() + this.totalGst());

  async toggleView() {
    this.viewBills.set(!this.viewBills());
    if (this.viewBills()) await this.data.loadBills();
  }

  searchMeds() {
    if (this.medSearch.length < 2) { this.searchResults.set([]); return; }
    this.searchResults.set(
      this.data.searchMedicines(this.medSearch).filter((m: any) => m.stock > 0)
    );
  }

  selectMedicine(med: any) {
    this.selectedMed.set(med);
    this.medSearch = med.name;
    this.addQty = 1;
    this.addDiscount = 0;
    this.searchResults.set([]);
  }

  // Called when barcode scanner finds a medicine
  onBarcodeScanned(event: { medicine: any; quantity: number }) {
    const med = event.medicine;
    const afterDisc = med.sellingPrice * event.quantity;
    const gst = afterDisc * med.gst / 100;
    const item = { medicine: med, quantity: event.quantity, discount: 0, total: afterDisc + gst };
    this.items.update(list => {
      const idx = list.findIndex((i: any) => i.medicine.id === med.id);
      if (idx >= 0) {
        const updated = [...list];
        updated[idx].quantity += event.quantity;
        updated[idx].total = updated[idx].medicine.sellingPrice * updated[idx].quantity * (1 + updated[idx].medicine.gst / 100);
        return updated;
      }
      return [...list, item];
    });
  }

    addItem() {
      const med = this.selectedMed();
      if (!med || this.addQty < 1) return;
      const afterDisc = med.sellingPrice * this.addQty * (1 - this.addDiscount / 100);
      const gst = afterDisc * med.gst / 100;
      const item = { medicine: med, quantity: this.addQty, discount: this.addDiscount, total: afterDisc + gst };
      this.items.update(list => {
        const idx = list.findIndex((i: any) => i.medicine.id === med.id);
        if (idx >= 0) { const updated = [...list]; updated[idx] = item; return updated; }
        return [...list, item];
      });
      this.medSearch = '';
      this.selectedMed.set(null);
      this.searchResults.set([]);
    }

    removeItem(i: number) {
      this.items.update(list => list.filter((_: any, idx: number) => idx !== i));
    }

    async saveBill() {
      if (!this.customerName || this.items().length === 0) return;
      this.saving.set(true);
      try {
        const bill = await this.data.addBill({
          customerName: this.customerName,
          customerPhone: this.customerPhone,
          doctorName: this.doctorName,
          items: this.items(),
          subtotal: this.subtotal(),
          totalDiscount: this.totalDiscount(),
          totalGst: this.totalGst(),
          grandTotal: this.grandTotal(),
          paymentMode: this.paymentMode,
          status: 'paid'
        });
        this.savedBill.set(bill);
      } catch (e) {
        console.error('Bill save error:', e);
        alert('Error saving bill. Check backend!');
      } finally {
        this.saving.set(false);
      }
    }

  // ─── PDF DOWNLOAD ────────────────────────────
  downloadPdf() {
    const bill = this.savedBill();
    if (!bill) return;
    this.pdfService.generateBillPdf(bill);
  }

  // ─── SHARE PDF VIA WHATSAPP (mobile native share) ─
  async sendWhatsApp() {
    const bill = this.savedBill();
    if (!bill) return;

    this.sharing.set(true);
    try {
      const shared = await this.pdfService.shareBillPdf(bill);

      if (!shared) {
        // Fallback for desktop: download PDF + open WhatsApp web with text
        this.pdfService.generateBillPdf(bill);

        const phone = bill.customerPhone?.replace(/[^0-9]/g, '');
        if (phone) {
          const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`;
          const message = `💊 *MediShop Bill*\n🧾 ${bill.billNo}\n💰 Total: ₹${parseFloat(bill.grandTotal).toFixed(2)}\n\n📎 PDF downloaded - please attach it here!`;
          setTimeout(() => {
            window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank');
          }, 500);
        }
      }
    } finally {
      this.sharing.set(false);
    }
  }

  printBill() { window.print(); }
  newBill() { this.savedBill.set(null); this.clearBill(); }
  clearBill() {
    this.customerName = '';
    this.customerPhone = '';
    this.doctorName = '';
    this.paymentMode = 'cash';
    this.items.set([]);
    this.medSearch = '';
    this.selectedMed.set(null);
  }
}