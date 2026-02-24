import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Film, FileText, ChevronRight } from "lucide-react";

const LAST_UPDATED = "February 24, 2026";
const EFFECTIVE_DATE = "February 24, 2026";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    text: "By accessing or using the Ckript platform (\"Platform\"), you confirm that you are at least 18 years of age, have read and understood these Terms of Service (\"Terms\"), and agree to be legally bound by them. If you do not agree to these Terms, you must not access or use the Platform. These Terms apply to all users including writers, creators, producers, directors, investors, and other industry professionals.",
  },
  {
    id: "account",
    title: "2. Account Registration & Security",
    bullets: [
      "You must provide accurate, current, and complete information during registration",
      "You are responsible for maintaining the confidentiality of your account credentials",
      "You must notify us immediately at info.ckript@gmail.com if you suspect unauthorised access to your account",
      "You may not create accounts on behalf of others without their explicit consent",
      "One person may not maintain more than one active account without prior written permission from Ckript",
      "Ckript reserves the right to suspend or terminate accounts that violate these Terms",
    ],
  },
  {
    id: "platform-use",
    title: "3. Platform Usage & Acceptable Conduct",
    content: [
      {
        subtitle: "Permitted Use",
        text: "You may use the Platform to publish, discover, and transact around creative content (scripts, treatments, pitches) for entertainment industry purposes, including engaging with our AI-powered features and matchmaking services.",
      },
      {
        subtitle: "Prohibited Conduct",
        text: "You must not: upload content you do not own or have rights to; impersonate any person or entity; engage in harassment, abuse, or hate speech; attempt to gain unauthorised access to any part of the Platform; use automated bots or scrapers; circumvent payment or access controls; use the Platform for any unlawful purpose; or interfere with the integrity or performance of the Platform.",
      },
      {
        subtitle: "Content Standards",
        text: "All content posted on Ckript must be original, legally owned by you, and comply with applicable laws. Content that is defamatory, obscene, or infringes any third-party intellectual property rights is strictly prohibited and will be removed.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "4. Intellectual Property",
    content: [
      {
        subtitle: "Your Content",
        text: "You retain full ownership of all creative materials you upload to Ckript — including scripts, loglines, synopses, trailers, and images. By submitting content, you grant Ckript a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote your content within the Platform and in our marketing communications. This licence is limited strictly to facilitating the Platform's operation and ends when you remove the content or close your account.",
      },
      {
        subtitle: "Ckript Platform",
        text: "All Platform technology, design, branding, software, and non-user-generated content are and remain the exclusive intellectual property of Ckript. You may not reproduce, modify, reverse-engineer, or create derivative works from our Platform without prior written consent.",
      },
      {
        subtitle: "DMCA / Copyright Infringement",
        text: "If you believe your copyright has been infringed by content on the Platform, please send a notice to info.ckript@gmail.com including a description of the work, the allegedly infringing URL, and your contact information. We will respond promptly.",
      },
    ],
  },
  {
    id: "payments",
    title: "5. Subscription Plans & Payments",
    content: [
      {
        subtitle: "Subscription Plans",
        text: "Ckript offers free and paid subscription tiers. Paid subscriptions are billed on a monthly basis and automatically renew until cancelled. Prices are displayed in USD and may be updated with at least 30 days' notice.",
      },
      {
        subtitle: "Unlock Transactions",
        text: "Industry professionals may pay to unlock full scripts. Upon a successful unlock, 100% of the unlock fee is credited to the creator's account. Ckript charges a platform service fee separate from the unlock fee as described on the pricing page.",
      },
      {
        subtitle: "Refund Policy",
        text: "Monthly subscription fees are non-refundable after billing. One-time service fees (professional evaluations, AI trailer generation) are non-refundable once processing has begun. If you believe you were charged in error, contact us within 7 days at info.ckript@gmail.com.",
      },
      {
        subtitle: "Payment Processing",
        text: "All payments are processed securely by Stripe. Ckript does not store card details. By providing payment information, you agree to Stripe's terms of service.",
      },
    ],
  },
  {
    id: "option-hold",
    title: "6. Option Hold & Exclusivity",
    text: "When a producer places an Option Hold on a script, the script becomes exclusively reserved for that producer for the agreed option period. During this period, the writer agrees not to enter into conflicting agreements with other parties for that script. Option Hold terms, duration, and compensation are agreed between parties within the Platform. Ckript facilitates but is not a party to any option agreement and bears no liability for disputes arising from such agreements.",
  },
  {
    id: "ai-features",
    title: "7. AI-Powered Features",
    text: "Ckript provides AI-powered features including script analysis, trailer generation, and smart matching. These features are provided 'as-is' for informational and creative assistance purposes only. AI-generated suggestions, scores, and matches are automated outputs and do not constitute professional legal, financial, or creative advice. Ckript does not guarantee the accuracy, completeness, or fitness for purpose of any AI-generated output. You use these features at your own discretion.",
  },
  {
    id: "privacy",
    title: "8. Privacy",
    text: "Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the data practices described in our Privacy Policy.",
  },
  {
    id: "termination",
    title: "9. Termination",
    content: [
      {
        subtitle: "Termination by You",
        text: "You may delete your account at any time from your account settings. Upon deletion, your personal data will be removed within 30 days, subject to our data retention obligations. Cancelling a paid subscription stops future billing but does not refund any current billing period.",
      },
      {
        subtitle: "Termination by Ckript",
        text: "We reserve the right to suspend or permanently terminate your account if you breach these Terms, engage in conduct harmful to other users or the Platform, or for any other reason at our sole discretion with or without notice for serious violations. We will endeavour to provide reasonable notice for non-urgent terminations.",
      },
    ],
  },
  {
    id: "disclaimers",
    title: "10. Disclaimers & Limitation of Liability",
    content: [
      {
        subtitle: "Platform Availability",
        text: "Ckript provides the Platform on an 'as available' basis. We do not warrant uninterrupted or error-free service and may perform maintenance or updates that temporarily affect availability.",
      },
      {
        subtitle: "No Guarantee of Deals or Success",
        text: "Ckript facilitates connections between creators and industry professionals but does not guarantee any deal, option, sale, production, or career outcome. Results vary and depend entirely on third-party decisions outside Ckript's control.",
      },
      {
        subtitle: "Limitation of Liability",
        text: "To the fullest extent permitted by applicable law, Ckript and its officers, directors, employees, and affiliates shall not be liable for any indirect, incidental, consequential, punitive, or special damages arising from your use of or inability to use the Platform, even if advised of the possibility of such damages. Our total aggregate liability to you shall not exceed the amounts paid by you to Ckript in the 12 months preceding the claim.",
      },
    ],
  },
  {
    id: "indemnification",
    title: "11. Indemnification",
    text: "You agree to indemnify, defend, and hold harmless Ckript and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising out of or relating to your use of the Platform, your content, your violation of these Terms, or your violation of any rights of a third party.",
  },
  {
    id: "governing-law",
    title: "12. Governing Law & Dispute Resolution",
    text: "These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising out of or relating to these Terms or your use of the Platform shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes will be submitted to binding arbitration. You waive any right to participate in a class action lawsuit or class-wide arbitration against Ckript.",
  },
  {
    id: "changes",
    title: "13. Changes to These Terms",
    text: "We may revise these Terms at any time. For material changes, we will provide at least 14 days' notice via email or a prominent notice on the Platform before the new Terms take effect. Continued use of the Platform following the effective date constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.",
  },
  {
    id: "contact",
    title: "14. Contact Us",
    contactBlock: true,
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-7 h-7 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Ckript
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-cyan-400 transition"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Legal
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <span>
              <span className="text-gray-500">Effective:</span>{" "}
              <span className="text-gray-300">{EFFECTIVE_DATE}</span>
            </span>
            <span>
              <span className="text-gray-500">Last updated:</span>{" "}
              <span className="text-gray-300">{LAST_UPDATED}</span>
            </span>
          </div>
          <p className="mt-6 text-gray-400 text-base leading-relaxed border-l-2 border-blue-500/30 pl-4">
            These Terms of Service govern your use of the Ckript platform operated by Ckript.
            Please read these Terms carefully before using our services. By creating an account
            or accessing the Platform, you agree to be bound by these Terms.
          </p>
        </motion.div>

        {/* Quick Nav */}
        <motion.nav
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-12 p-5 rounded-xl bg-slate-900/60 border border-slate-700/50"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
            Contents
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-gray-400 hover:text-blue-400 transition flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-blue-500/50" />
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <motion.section
              key={section.id}
              id={section.id}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-slate-700/50">
                {section.title}
              </h2>

              {section.text && (
                <p className="text-gray-400 text-sm leading-relaxed">{section.text}</p>
              )}

              {section.content?.map((block, bi) => (
                <div key={bi} className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-400 mb-1.5">{block.subtitle}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{block.text}</p>
                </div>
              ))}

              {section.bullets && (
                <ul className="space-y-2">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {section.contactBlock && (
                <div className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-6 text-sm text-gray-400 space-y-2">
                  <p>
                    If you have any questions about these Terms or your legal rights, please
                    reach out:
                  </p>
                  <p>
                    <span className="text-gray-500">Email: </span>
                    <a href="mailto:info.ckript@gmail.com" className="text-blue-400 hover:underline">
                      info.ckript@gmail.com
                    </a>
                  </p>
                  <p>
                    <span className="text-gray-500">LinkedIn: </span>
                    <a
                      href="https://www.linkedin.com/company/ckript/?viewAsMember=true"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      linkedin.com/company/ckript
                    </a>
                  </p>
                </div>
              )}
            </motion.section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <span>&copy; 2026 Ckript. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-cyan-400 transition">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-cyan-400 transition">
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
