import { motion, AnimatePresence } from "framer-motion";
import { Play, TrendingUp, Lock, Star, Mic, PenTool, BookOpen, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Play,
    tag: "AI · Video",
    title: "Text-to-Trailer AI",
    subtitle: "30-sec visual pitch from scripts",
    description: "Producers are visual people — they hate reading 10-page scripts. Our AI instantly transforms your script into a captivating 30-second video trailer using stock footage and AI-generated visuals, making your idea impossible to ignore.",
    benefits: ["Auto-generate trailers in seconds", "Hook decision-makers visually", "Increase discovery rate by 5x"],
    accent: "cyan",
  },
  {
    icon: Lock,
    tag: "Monetisation",
    title: "Locked Ideas + Paid Unlocks",
    subtitle: "Summaries public, full ideas protected",
    description: "Your full script stays protected behind a paywall. Share a compelling public summary to attract interest, then let producers pay to unlock the complete work — ensuring your IP is never exposed for free.",
    benefits: ["Full script IP protection", "Earn from every unlock", "Public teasers drive demand"],
    accent: "blue",
  },
  {
    icon: Star,
    tag: "AI · Discovery",
    title: "AI Smart Matching Engine",
    subtitle: "Quality scoring + producer fit",
    description: "Stop searching. The algorithm scores script quality and tracks producer history to automatically surface the most relevant matches. Writers get discovered by producers actively seeking their exact genre.",
    benefits: ["Auto-match by genre & style", "AI quality scoring", "Real-time producer notifications"],
    accent: "violet",
  },
  {
    icon: Mic,
    tag: "AI · Analysis",
    title: "Script Validation & Scoring",
    subtitle: "AI-based story analysis",
    description: "Every script is analysed by our AI for structure, originality, market fit, and storytelling quality. Get a detailed score breakdown so you know exactly where your script stands before it reaches any producer.",
    benefits: ["Detailed AI score report", "Structure & originality analysis", "Market-fit recommendations"],
    accent: "teal",
  },
  {
    icon: TrendingUp,
    tag: "Business",
    title: "Option Hold Exclusivity",
    subtitle: "30-day paid holding periods",
    description: "Producers pay a fee to hold your script exclusively for 30 days while they decide. This creates urgency, protects your work from being shopped elsewhere, and generates guaranteed income regardless of the final deal.",
    benefits: ["Guaranteed income per hold", "Exclusive 30-day lock-in", "Drives faster producer decisions"],
    accent: "orange",
  },
  {
    icon: PenTool,
    tag: "AI · Writing",
    title: "AI Writing Studio",
    subtitle: "AI-assisted text editor",
    description: "Write, refine, and polish your scripts directly on the platform with an AI co-pilot. Get real-time suggestions on dialogue, pacing, and structure — so every draft you submit is your strongest possible version.",
    benefits: ["Real-time AI co-writing", "Dialogue & pacing suggestions", "In-platform draft management"],
    accent: "purple",
  },
  {
    icon: BookOpen,
    tag: "Review",
    title: "Expert Reader Reviews",
    subtitle: "Platform-curated professionals",
    description: "Every project is reviewed by platform-curated expert readers who provide professional coverage. Get industry-standard feedback that helps you understand how real decision-makers will perceive your work.",
    benefits: ["Industry-standard coverage", "Curated expert reviewers", "Actionable professional feedback"],
    accent: "emerald",
  },
];

const accentMap = {
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/25",    text: "text-cyan-400",    dot: "bg-cyan-400",    ring: "ring-cyan-500/30",    activeBorder: "border-cyan-500/50"    },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    dot: "bg-blue-400",    ring: "ring-blue-500/30",    activeBorder: "border-blue-500/50"    },
  violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-400",  dot: "bg-violet-400",  ring: "ring-violet-500/30",  activeBorder: "border-violet-500/50"  },
  teal:    { bg: "bg-teal-500/10",    border: "border-teal-500/25",    text: "text-teal-400",    dot: "bg-teal-400",    ring: "ring-teal-500/30",    activeBorder: "border-teal-500/50"    },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/25",  text: "text-orange-400",  dot: "bg-orange-400",  ring: "ring-orange-500/30",  activeBorder: "border-orange-500/50"  },
  purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/25",  text: "text-purple-400",  dot: "bg-purple-400",  ring: "ring-purple-500/30",  activeBorder: "border-purple-500/50"  },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", dot: "bg-emerald-400", ring: "ring-emerald-500/30", activeBorder: "border-emerald-500/50" },
};

const FeaturesShowcase = () => {
  const [active, setActive] = useState(0);
  const f = features[active];
  const a = accentMap[f.accent];
  const Icon = f.icon;

  return (
    <section id="platform-innovations" className="relative py-28 px-6 overflow-hidden bg-slate-950">
      {/* dot-grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-64 bg-cyan-500/4 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400/70">Platform Innovations</span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Revolutionary Features That{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Change Everything
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Seven innovations that transform how stories are discovered, protected, and monetized.
          </p>
        </motion.div>

        {/* ── Feature grid tabs ── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {features.map((feat, i) => {
            const TabIcon = feat.icon;
            const tab = accentMap[feat.accent];
            const isActive = active === i;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`group flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all duration-200 text-center ${
                  isActive
                    ? `${tab.bg} ${tab.activeBorder} ring-1 ${tab.ring}`
                    : "border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? tab.bg : "bg-slate-800"}`}>
                  <TabIcon className={`w-4 h-4 ${isActive ? tab.text : "text-slate-500 group-hover:text-slate-400"}`} />
                </div>
                <span className={`text-[11px] font-semibold leading-tight ${isActive ? tab.text : "text-slate-500 group-hover:text-slate-400"}`}>
                  {feat.title.split(" ").slice(0, 3).join(" ")}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Detail Panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className={`relative rounded-2xl border ${a.border} ${a.bg} overflow-hidden`}
          >
            {/* top shimmer */}
            <div className={`absolute top-0 left-20 right-20 h-px bg-gradient-to-r from-transparent via-current to-transparent ${a.text} opacity-30`} />

            <div className="p-8 sm:p-10 grid md:grid-cols-5 gap-8 items-start">
              {/* Left: description */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${a.bg} border ${a.border}`}>
                    <Icon className={`w-6 h-6 ${a.text}`} />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${a.text} opacity-80`}>{f.tag}</span>
                    <h3 className="text-2xl font-extrabold text-white leading-tight">{f.title}</h3>
                    <p className={`text-[13px] font-medium ${a.text}`}>{f.subtitle}</p>
                  </div>
                </div>
                <p className="text-slate-300 text-[15px] leading-relaxed">
                  {f.description}
                </p>
              </div>

              {/* Right: benefits */}
              <div className="md:col-span-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${a.text}`}>Key Benefits</p>
                <ul className="space-y-3">
                  {f.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${a.text}`} />
                      <span className="text-[14px] text-slate-300 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* feature number badge */}
                <div className="mt-8 flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${a.text} opacity-50`}>
                    Feature {active + 1} of {features.length}
                  </span>
                  <div className="flex gap-1">
                    {features.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`h-1 rounded-full transition-all duration-200 ${i === active ? `w-5 ${a.dot}` : "w-1.5 bg-slate-700 hover:bg-slate-600"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default FeaturesShowcase;
