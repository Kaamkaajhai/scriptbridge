import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, ChevronRight } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import {
  SCRIPT_UPLOAD_TERMS_EFFECTIVE_DATE,
  SCRIPT_UPLOAD_TERMS_LAST_UPDATED,
  SCRIPT_UPLOAD_TERMS_TEXT,
  SCRIPT_UPLOAD_TERMS_VERSION,
} from "../constants/scriptUploadTerms";

const sections = SCRIPT_UPLOAD_TERMS_TEXT.split("\n\n").filter(Boolean);

export default function ScriptUploadTermsConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <BrandLogo className="h-9 w-auto" />
          <Link to="/upload" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Script Upload
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Script Upload Terms & Conditions</h1>
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <span>
              <span className="text-gray-500">Effective:</span> <span className="text-gray-300">{SCRIPT_UPLOAD_TERMS_EFFECTIVE_DATE}</span>
            </span>
            <span>
              <span className="text-gray-500">Last updated:</span> <span className="text-gray-300">{SCRIPT_UPLOAD_TERMS_LAST_UPDATED}</span>
            </span>
            <span>
              <span className="text-gray-500">Version:</span> <span className="text-gray-300">{SCRIPT_UPLOAD_TERMS_VERSION}</span>
            </span>
          </div>
        </motion.div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <motion.section
              key={`${index}-${section.slice(0, 24)}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35 }}
              className="rounded-xl bg-slate-900/55 border border-slate-700/50 p-5"
            >
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{section}</p>
            </motion.section>
          ))}
        </div>
      </main>
    </div>
  );
}
