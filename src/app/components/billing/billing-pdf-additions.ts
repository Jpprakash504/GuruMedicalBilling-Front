// =============================================
// Add these to billing.component.ts
// =============================================

// 1. Add this import at the top:
import { PdfService } from '../../services/pdf.service';

// 2. Add PdfService to constructor:
constructor(
  private data: DataService,
  private pdfService: PdfService  // ← ADD THIS
) {
  this.data.loadBills();
  this.data.loadMedicines();
}

// 3. Add this new method (replace old sendWhatsApp if needed):
downloadPdf() {
  const bill = this.savedBill();
  if (!bill) return;
  this.pdfService.generateBillPdf(bill);
}

// 4. UPDATED sendWhatsApp - downloads PDF first, then opens WhatsApp with instructions
sendWhatsApp() {
  const bill = this.savedBill();
  if (!bill) return;
  const phone = bill.customerPhone?.replace(/[^0-9]/g, '');
  if (!phone) { alert('Customer phone number இல்லை!'); return; }

  // Step 1: Download PDF automatically
  this.pdfService.generateBillPdf(bill);

  // Step 2: Open WhatsApp with short message (PDF needs manual attach)
  const message = [
    `💊 *MediShop Bill*`,
    `🧾 Bill No: ${bill.billNo}`,
    `💰 Total: ₹${parseFloat(bill.grandTotal).toFixed(2)}`,
    ``,
    `📎 PDF bill downloaded - please attach it in this chat!`
  ].join('\n');

  const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`;

  // Small delay so PDF download starts first
  setTimeout(() => {
    window.open(`https://wa.me/${indiaPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }, 500);
}
