import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads", "invoices");
const logoCandidates = [
  path.join(__dirname, "..", "..", "client", "public", "cklogo-nobg.png"),
  path.join(__dirname, "..", "..", "client", "public", "cklogo.png"),
];

const COMPANY_NAME = process.env.COMPANY_NAME || "CKRIPT";
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "info.ckript@gmail.com";
const COMPANY_LOCATION = process.env.COMPANY_LOCATION || "Pune, Maharashtra, India";
const FOUNDER_NAME = process.env.FOUNDER_NAME || "Yash";

const asCurrency = (value = 0) => `INR ${Number(value || 0).toFixed(2)}`;
const asDate = (value) => new Date(value || Date.now()).toLocaleString();

const pickLogoPath = () => logoCandidates.find((candidate) => fs.existsSync(candidate));

export const generateAndSaveInvoicePdf = async ({
  invoice,
  creatorName,
  creatorEmail,
  creatorSid,
  scriptTitle,
  scriptSid,
}) => {
  if (!invoice?._id || !invoice?.invoiceNumber) {
    throw new Error("Invoice details are required to generate PDF");
  }

  fs.mkdirSync(uploadsDir, { recursive: true });

  const safeInvoiceNumber = String(invoice.invoiceNumber).replace(/[^a-zA-Z0-9-_]/g, "_");
  const filename = `${safeInvoiceNumber}-${invoice._id}.pdf`;
  const absolutePath = path.join(uploadsDir, filename);
  const relativePath = `/uploads/invoices/${filename}`;
  const logoPath = pickLogoPath();
  const resolvedCreatorSid = creatorSid || invoice.creatorSid || "-";
  const resolvedScriptSid = scriptSid || invoice.scriptSid || "-";

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const stream = fs.createWriteStream(absolutePath);

    stream.on("finish", resolve);
    stream.on("error", reject);
    doc.on("error", reject);

    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const left = 48;
    const right = pageWidth - 48;
    let y = 44;

    doc.save();
    doc.rect(left, y, right - left, 112).fill("#F7FAFF");
    doc.restore();

    if (logoPath) {
      try {
        doc.image(logoPath, left + 10, y + 14, { fit: [128, 40], align: "left" });
      } catch {
        doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text(COMPANY_NAME, left + 10, y + 24);
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0F172A").text(COMPANY_NAME, left + 10, y + 24);
    }

    doc.font("Helvetica-Bold").fontSize(19).fillColor("#0F172A").text("INVOICE", right - 146, y + 18, {
      width: 136,
      align: "right",
    });

    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`Invoice No: ${invoice.invoiceNumber}`, right - 190, y + 48, {
      width: 180,
      align: "right",
    });
    doc.text(`Issued: ${asDate(invoice.invoiceDate || invoice.createdAt)}`, right - 190, y + 64, {
      width: 180,
      align: "right",
    });

    doc.font("Helvetica").fontSize(10).fillColor("#1E293B").text(COMPANY_EMAIL, left + 10, y + 70);
    doc.text(COMPANY_LOCATION, left + 10, y + 86);

    y += 132;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text("Bill To", left, y);
    doc.font("Helvetica-Bold").text("Project Details", right - 220, y, { width: 220, align: "left" });

    y += 18;
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(creatorName || "-", left, y);
    doc.text(creatorEmail || "", left, y + 14);
    doc.text(`Creator SID: ${resolvedCreatorSid}`, left, y + 28);

    doc.text(scriptTitle || "-", right - 220, y, { width: 220, align: "left" });
    doc.text(`Script SID: ${resolvedScriptSid}`, right - 220, y + 14, { width: 220, align: "left" });
    doc.text(
      invoice.accessType === "premium"
        ? `Access: Premium (${asCurrency(invoice.scriptPrice || 0)})`
        : "Access: Free",
      right - 220,
      y + 28,
      { width: 220, align: "left" }
    );

    y += 58;
    doc.save();
    doc.rect(left, y, right - left, 24).fill("#EAF2FF");
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0F172A");
    doc.text("ITEM", left + 8, y + 7, { width: 200 });
    doc.text("TYPE", left + 270, y + 7, { width: 120 });
    doc.text("AMOUNT", right - 120, y + 7, { width: 112, align: "right" });
    y += 28;

    const rows = Array.isArray(invoice.rows) ? invoice.rows : [];
    rows.forEach((row, idx) => {
      const itemText = `${idx + 1}. ${row.item || "Item"}`;
      const detail = row.detail || "";

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(itemText, left + 8, y, {
        width: 250,
      });
      doc.font("Helvetica").fontSize(9).fillColor("#475569").text(row.type || "-", left + 270, y, {
        width: 120,
      });
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text(row.amountLabel || "-", right - 120, y, {
        width: 112,
        align: "right",
      });

      if (detail) {
        const detailHeight = doc.heightOfString(detail, { width: 250 });
        doc.font("Helvetica").fontSize(9).fillColor("#64748B").text(detail, left + 8, y + 13, { width: 250 });
        y += Math.max(30, detailHeight + 18);
      } else {
        y += 24;
      }

      doc.save();
      doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor("#E2E8F0").stroke();
      doc.restore();
      y += 8;
    });

    y += 8;
    doc.save();
    doc.roundedRect(right - 220, y, 220, 88, 8).fill("#F8FAFC");
    doc.restore();
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A").text("Summary", right - 208, y + 10);
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`Due Now: ${invoice.totalCreditsRequired || 0} credits`, right - 208, y + 28);
    doc.text(`Balance After: ${invoice.creditsBalanceAfter ?? 0} credits`, right - 208, y + 42);
    doc.text(`Net Per Premium Sale: ${asCurrency(invoice.writerEarnsPerSale || 0)}`, right - 208, y + 56);

    const signatureY = y + 118;
    doc.font("Helvetica").fontSize(9).fillColor("#64748B").text("Authorized by", left, signatureY);
    doc.font("Helvetica-Oblique").fontSize(22).fillColor("#0F172A").text(FOUNDER_NAME, left, signatureY + 10);
    doc.save();
    doc.moveTo(left, signatureY + 42).lineTo(left + 178, signatureY + 42).lineWidth(0.8).strokeColor("#94A3B8").stroke();
    doc.restore();
    doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`Founder, ${COMPANY_NAME}`, left, signatureY + 47);

    doc.end();
  });

  return { absolutePath, relativePath };
};
