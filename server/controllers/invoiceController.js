import path from "path";
import { fileURLToPath } from "url";
import Invoice from "../models/Invoice.js";
import { generateAndSaveInvoicePdf } from "../utils/invoicePdf.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const canAccessInvoice = (invoice, user) => {
	if (!invoice || !user) return false;
	if (user.role === "admin") return true;
	return String(invoice.creator?._id || invoice.creator) === String(user._id);
};

export const getInvoicePdf = async (req, res) => {
	try {
		const invoice = await Invoice.findById(req.params.id)
			.populate("creator", "name email sid")
			.populate("script", "title sid");

		if (!invoice) {
			return res.status(404).json({ message: "Invoice not found" });
		}

		if (!canAccessInvoice(invoice, req.user)) {
			return res.status(403).json({ message: "Access denied" });
		}

		if (!invoice.pdfPath) {
			const generated = await generateAndSaveInvoicePdf({
				invoice,
				creatorName: invoice.creator?.name,
				creatorEmail: invoice.creator?.email,
				creatorSid: invoice.creatorSid || invoice.creator?.sid,
				scriptTitle: invoice.script?.title,
				scriptSid: invoice.scriptSid || invoice.script?.sid,
			});
			invoice.pdfPath = generated.relativePath;
			invoice.pdfGeneratedAt = new Date();
			await invoice.save();
		}

		const absolutePdfPath = path.join(__dirname, "..", invoice.pdfPath.replace(/^\//, ""));
		const isDownload = String(req.query.download || "").toLowerCase() === "1";
		const disposition = isDownload ? "attachment" : "inline";

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `${disposition}; filename=\"${invoice.invoiceNumber}.pdf\"`);
		return res.sendFile(absolutePdfPath);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};
