// pdf.service.ts - UPDATED with Web Share API
// Generates PDF and shares directly via WhatsApp (mobile) using native Share Sheet
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfService {

  // Generate PDF and return as Blob (for sharing) or File
  private buildPdfDoc(bill: any): jsPDF {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Shop Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('MediShop', 14, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Medical Store & Pharmacy', 14, y + 5);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('TAX INVOICE', pageWidth - 14, y, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(37, 99, 235);
    doc.text(bill.billNo || '', pageWidth - 14, y + 5, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(`Date: ${bill.date}`, pageWidth - 14, y + 10, { align: 'right' });

    y += 18;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // Customer Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 22, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Bill To:', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(bill.customerName || '', 18, y + 11);
    if (bill.customerPhone) doc.text(`Phone: ${bill.customerPhone}`, 18, y + 16);

    if (bill.doctorName) {
      doc.setFont('helvetica', 'bold');
      doc.text('Doctor:', 90, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(bill.doctorName, 90, y + 11);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Payment:', pageWidth - 60, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text((bill.paymentMode || '').toUpperCase(), pageWidth - 60, y + 11);

    y += 28;

    // Items Table
    const tableData = (bill.items || []).map((item: any, i: number) => [
      (i + 1).toString(),
      item.medicineName || item.medicine?.name || '',
      item.quantity?.toString() || '0',
      `Rs.${Number(item.rate || item.medicine?.sellingPrice || 0).toFixed(2)}`,
      `${item.discount || 0}%`,
      `${item.gst || item.medicine?.gst || 0}%`,
      `Rs.${Number(item.total || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Medicine', 'Qty', 'Rate', 'Disc', 'GST', 'Amount']],
      body: tableData,
      theme: 'plain',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10 }, 2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' }, 6: { cellWidth: 28, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const totalsX = pageWidth - 70;

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(`Rs.${Number(bill.subtotal || 0).toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });

    doc.text('Discount:', totalsX, finalY + 6);
    doc.setTextColor(220, 38, 38);
    doc.text(`- Rs.${Number(bill.totalDiscount || 0).toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' });

    doc.setTextColor(71, 85, 105);
    doc.text('GST:', totalsX, finalY + 12);
    doc.text(`Rs.${Number(bill.totalGst || 0).toFixed(2)}`, pageWidth - 14, finalY + 12, { align: 'right' });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(totalsX, finalY + 16, pageWidth - 14, finalY + 16);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Grand Total:', totalsX, finalY + 23);
    doc.text(`Rs.${Number(bill.grandTotal || 0).toFixed(2)}`, pageWidth - 14, finalY + 23, { align: 'right' });

    const footerY = finalY + 38;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your visit! Get well soon.', pageWidth / 2, footerY + 7, { align: 'center' });

    return doc;
  }

  // Download PDF (works everywhere)
  generateBillPdf(bill: any): void {
    const doc = this.buildPdfDoc(bill);
    const fileName = `${bill.billNo || 'bill'}_${bill.customerName?.replace(/\s+/g, '_') || 'invoice'}.pdf`;
    doc.save(fileName);
  }

  // Share PDF directly via WhatsApp/any app using native Share Sheet (MOBILE ONLY)
  // Returns true if shared successfully, false if not supported (fallback to download)
  async shareBillPdf(bill: any): Promise<boolean> {
    const doc = this.buildPdfDoc(bill);
    const fileName = `${bill.billNo || 'bill'}_${bill.customerName?.replace(/\s+/g, '_') || 'invoice'}.pdf`;
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Check if Web Share API with file support is available (mostly mobile browsers)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `MediShop Bill - ${bill.billNo}`,
          text: `Bill for ${bill.customerName} - Total: Rs.${parseFloat(bill.grandTotal).toFixed(2)}`,
        });
        return true; // User picked an app (WhatsApp, etc.) and shared
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // User cancelled
        console.warn('Share failed:', err);
        return false;
      }
    }

    // Not supported (most desktop browsers) — fallback to download
    return false;
  }
}