import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, ChevronRight, Film } from "lucide-react";

const LAST_UPDATED = "March 24, 2026";
const EFFECTIVE_DATE = "March 24, 2026";

const sections = [
  {
    title: "1. INTRODUCTION",
    paragraphs: [
      'Ckript.com ("Platform", "Company", "we", "us", "our") is committed to protecting your privacy and handling your personal information in a transparent and secure manner.',
      'This Privacy Policy explains how we collect, use, process, store, and disclose your information when you access or use our services ("Services").',
      "By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy and agree to the practices described herein.",
    ],
  },
  {
    title: "2. SCOPE AND APPLICABILITY",
    paragraphs: [
      "This Privacy Policy applies to website usage, account registration, script uploads and content interactions, transactions and payments, and AI-powered services.",
      "This Policy applies to all users, including Writers and Investors.",
    ],
  },
  {
    title: "3. INFORMATION WE COLLECT",
    points: [
      "3.1 Personal Identifiers: full name, email address, phone number, username and profile information.",
      "3.2 Identity Verification (KYC) Data (where applicable): government-issued ID (e.g., PAN, Aadhaar), address information.",
      "3.3 Financial & Transactional Information: payment details (processed via third-party providers such as Razorpay), billing details, transaction history. We do not store full payment card information.",
      "3.4 User-Generated Content: scripts uploaded, messages, comments, interactions, reviews, and feedback.",
      "3.5 Technical and Device Information: IP address, device type and operating system, browser type, access timestamps, approximate geolocation.",
      "3.6 Usage & Behavioral Data: pages visited, time spent on Platform, script views and interactions, feature usage patterns.",
      "3.7 AI Processing Data: content submitted for AI evaluations, AI trailer generation, and similarity detection.",
      "3.8 Communications: emails, support requests, and feedback.",
    ],
  },
  {
    title: "4. METHODS OF COLLECTION",
    points: [
      "Directly from you (registration, uploads, transactions).",
      "Automatically via cookies and analytics tools.",
      "From third-party service providers (payments, analytics).",
    ],
  },
  {
    title: "5. PURPOSE OF PROCESSING",
    points: [
      "5.1 Service Delivery: account creation/management, script hosting/discovery, enabling transactions.",
      "5.2 AI & Platform Features: script analysis/evaluation, similarity detection, feature improvement.",
      "5.3 Payments & Billing: processing transactions, managing credits, preventing payment fraud.",
      "5.4 Security & Fraud Prevention: detecting unauthorized access, preventing abuse and illegal activities.",
      "5.5 Analytics & Improvement: understanding user behavior, enhancing platform performance.",
      "5.6 Communication: notifications and updates, transaction alerts, customer support.",
    ],
  },
  {
    title: "6. AI & AUTOMATED PROCESSING",
    points: [
      "6.1 Your Content may be processed by automated systems, including artificial intelligence tools, for similarity detection, content evaluation, and feature generation.",
      "6.2 You acknowledge and agree that AI outputs may not be accurate and AI results are advisory only and not definitive.",
      "6.3 The Platform shall not be liable for any decisions made based on AI outputs.",
    ],
  },
  {
    title: "7. DATA SHARING AND DISCLOSURE",
    paragraphs: ["We do not sell your personal data."],
    points: [
      "7.1 Service Providers: payment processors (e.g., Razorpay), hosting/cloud providers, analytics services.",
      "7.2 Other Users: limited profile information and transaction-related details.",
      "7.3 Legal and Regulatory Authorities: in response to lawful requests and legal obligations.",
      "7.4 Business Transfers: merger, acquisition, restructuring, or sale.",
    ],
  },
  {
    title: "8. CONTENT HANDLING",
    points: [
      "Scripts are not publicly disclosed in full.",
      "Only previews/snippets are displayed.",
      "Content may be analyzed internally.",
      "We cannot guarantee complete protection against unauthorized access or copying.",
    ],
  },
  {
    title: "9. COOKIES AND TRACKING TECHNOLOGIES",
    points: [
      "We use cookies and similar technologies for authentication, session management, analytics, and performance tracking.",
      "Types include essential cookies, functional cookies, and analytical cookies.",
      "You may control cookies via browser settings.",
    ],
  },
  {
    title: "10. DATA SECURITY",
    paragraphs: [
      "We implement reasonable administrative, technical, and organizational safeguards to protect your data.",
      "No system is completely secure, and we do not guarantee absolute security.",
    ],
  },
  {
    title: "11. DATA RETENTION",
    points: [
      "We retain personal data for as long as your account is active.",
      "We retain data as required for legal, contractual, and compliance purposes.",
      "We may retain certain data even after account deletion where required by law.",
    ],
  },
  {
    title: "12. USER RIGHTS",
    points: [
      "Subject to applicable law, you may access your data, correct inaccuracies, request deletion, and withdraw consent.",
      "Requests may be limited by legal obligations or legitimate business needs.",
    ],
  },
  {
    title: "13. INTERNATIONAL USERS",
    points: [
      "If you access the Platform from outside India, your data may be transferred and processed in India.",
      "You consent to such transfer.",
    ],
  },
  {
    title: "14. CHILDREN'S PRIVACY",
    paragraphs: [
      "The Platform is not intended for individuals under 18.",
      "We do not knowingly collect data from minors.",
    ],
  },
  {
    title: "15. THIRD-PARTY LINKS AND SERVICES",
    points: [
      "The Platform may contain links to third-party services.",
      "We are not responsible for their privacy practices or their content.",
    ],
  },
  {
    title: "16. LIMITATION OF LIABILITY (PRIVACY)",
    points: [
      "To the maximum extent permitted by law, the Platform shall not be liable for unauthorized access, data breaches beyond reasonable control, loss of data, or third-party misuse.",
    ],
  },
  {
    title: "17. POLICY UPDATES",
    points: [
      "We may update this Privacy Policy at any time.",
      "Material changes may be communicated via platform notifications or email.",
      "Continued use constitutes acceptance.",
    ],
  },
  {
    title: "18. CONTACT INFORMATION",
    points: ["For privacy-related inquiries: Email: support@ckript.com"],
  },
];

export default function RegistrationPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-7 h-7 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Ckript
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Home
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
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <span>
              <span className="text-gray-500">Effective:</span> <span className="text-gray-300">{EFFECTIVE_DATE}</span>
            </span>
            <span>
              <span className="text-gray-500">Last updated:</span> <span className="text-gray-300">{LAST_UPDATED}</span>
            </span>
          </div>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35 }}
              className="rounded-xl bg-slate-900/55 border border-slate-700/50 p-5"
            >
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3">{section.title}</h2>

              {section.paragraphs?.map((paragraph, index) => (
                <p key={`${section.title}-p-${index}`} className="text-sm text-gray-300 leading-relaxed mb-2">
                  {paragraph}
                </p>
              ))}

              {section.points?.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-300 leading-relaxed">
                  {section.points.map((point, index) => (
                    <li key={`${section.title}-pt-${index}`}>{point}</li>
                  ))}
                </ul>
              )}
            </motion.section>
          ))}
        </div>
      </main>
    </div>
  );
}
