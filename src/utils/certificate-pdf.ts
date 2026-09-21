'use client';

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface CertificateData {
  learnerName: string;
  courseName: string;
  batchName?: string | null;
  certificateCode: string;
  issuedAt: string;
}

export async function downloadCertificatePDF(cert: CertificateData): Promise<void> {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build the certificate HTML element with ONLY hex/rgb colors
  // (no oklch, no CSS variables, no Tailwind classes)
  const container = document.createElement('div');
  container.style.cssText = [
    'width: 1123px',
    'height: 794px',
    'padding: 50px 70px',
    'background: #fffbeb',
    'border: 12px double #fbbf24',
    'text-align: center',
    'font-family: Georgia, "Times New Roman", serif',
    'box-sizing: border-box',
    'position: fixed',
    'left: -99999px',
    'top: 0',
    'color: #1e293b',
  ].join(';');

  const batchLineHTML = cert.batchName
    ? `<div style="font-size: 20px; color: #475569; margin: 10px 0 25px;">Batch: ${cert.batchName}</div>`
    : '';

  container.innerHTML = `
    <div style="font-size: 65px; line-height: 1; margin-bottom: 8px;">🎓</div>
    <h1 style="
      font-size: 42px;
      color: #b45309;
      letter-spacing: 5px;
      margin: 12px 0;
      font-family: Georgia, serif;
      font-weight: bold;
    ">CERTIFICATE OF COMPLETION</h1>
    <div style="
      width: 130px;
      height: 3px;
      background: #fbbf24;
      margin: 18px auto;
    "></div>
    <div style="
      font-size: 17px;
      color: #666666;
      margin: 25px 0 12px;
      font-style: italic;
    ">This is proudly presented to</div>
    <div style="
      font-size: 54px;
      color: #1e293b;
      border-bottom: 3px solid #1e293b;
      display: inline-block;
      padding: 0 55px 8px;
      margin: 8px 0 25px;
      line-height: 1.2;
    ">${cert.learnerName}</div>
    <div style="font-size: 17px; color: #666666; margin: 15px 0;">
      For successfully completing the course
    </div>
    <div style="
      font-size: 34px;
      color: #0f172a;
      font-style: italic;
      margin: 12px 0 8px;
      line-height: 1.2;
    ">${cert.courseName}</div>
    ${batchLineHTML}
    <div style="font-size: 14px; color: #666666; margin: 4px 0;">
      Issued on: ${issuedDate}
    </div>
    <div style="font-size: 14px; color: #666666; margin: 4px 0;">
      Certificate Code: ${cert.certificateCode}
    </div>
    <div style="display: flex; justify-content: space-around; margin-top: 40px;">
      <div style="
        border-top: 2px solid #666666;
        padding-top: 10px;
        width: 200px;
        font-size: 14px;
        color: #475569;
      ">Instructor</div>
      <div style="
        border-top: 2px solid #666666;
        padding-top: 10px;
        width: 200px;
        font-size: 14px;
        color: #475569;
      ">Platform</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Render to canvas using html2canvas-pro (supports oklch)
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 1123,
      height: 794,
      windowWidth: 1123,
      windowHeight: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create PDF — A4 landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1123, 794],
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 1123, 794);

    const fileName = `Certificate-${cert.learnerName.replace(/\s+/g, '-')}-${cert.certificateCode}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}