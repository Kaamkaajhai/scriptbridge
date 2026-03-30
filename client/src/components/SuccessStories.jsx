import { motion } from "framer-motion";
import { BadgeCheck, Quote } from "lucide-react";

const SuccessStories = () => {
  const stories = [
    {
      type: "creator",
      name: "Sarah Chen",
      role: "Screenplay Writer, Los Angeles",
      image: "SC",
      headline: "From no replies to a real option discussion",
      story:
        "I had a script people complimented but never moved forward on. On Ckript, I could present it with a trailer and clearer project notes. The first producer call happened in under two weeks, and we entered option talks right after.",
      metric: "First producer meeting in 11 days"
    },
    {
      type: "producer",
      name: "Marcus Williams",
      role: "Independent Producer, New York",
      image: "MW",
      headline: "Discovery became focused instead of noisy",
      story:
        "Most of my week used to go into sorting submissions that were not a fit. The filtering and matching made my shortlist tighter, and my team now spends more time on scripts we would actually develop.",
      metric: "2 scripts moved to paid development"
    },
    {
      type: "investor",
      name: "Priya Kapoor",
      role: "Film & Media Investor, London",
      image: "PK",
      headline: "Better visibility before capital goes in",
      story:
        "My issue was never interest in content IP, it was signal quality. Ckript gave me clearer context around genre fit, audience, and production scope. That made diligence faster and decisions more confident.",
      metric: "2 projects shortlisted in 6 weeks"
    },
    {
      type: "actor",
      name: "James Rodriguez",
      role: "Actor, Miami",
      image: "JR",
      headline: "I got in earlier than the usual casting cycle",
      story:
        "I wanted to connect with projects at script stage, not after roles were already narrowed. Through Ckript, I shared self-tapes with teams early and got invited into conversations before formal casting started.",
      metric: "1 early attachment offer secured"
    }
  ];

  const typeBadgeClass = {
    creator: "border-[#2e4a68] bg-[#12243a] text-[#b8cae0]",
    producer: "border-[#2e4a68] bg-[#12243a] text-[#b8cae0]",
    investor: "border-[#2e4a68] bg-[#12243a] text-[#b8cae0]",
    actor: "border-[#2e4a68] bg-[#12243a] text-[#b8cae0]",
  };

  const typeLabel = {
    creator: "Creator",
    producer: "Producer",
    investor: "Investor",
    actor: "Actor",
  };

  return (
    <section className="py-24 sm:py-28 px-6 border-y border-[#16273b] bg-[linear-gradient(180deg,#0b1422_0%,#0d1828_100%)]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="max-w-3xl mb-14 sm:mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[#9aacc3] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white tracking-tight leading-tight">
            Trusted by people who build projects in the real world
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 items-start gap-5 sm:gap-6">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group relative rounded-2xl border border-[#23394f] bg-[#0f1d30] p-6 sm:p-7 transition-all duration-300 hover:border-[#365574] hover:bg-[#112137] hover:shadow-[0_12px_30px_rgba(5,14,28,0.36)]"
            >
              <Quote className="absolute right-5 top-5 w-5 h-5 text-[#365273] opacity-70" />

              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#152740] border border-[#2f4a69] flex items-center justify-center text-xs font-bold text-[#bccde2]">
                    {story.image}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white leading-tight">{story.name}</h3>
                    <p className="text-xs text-[#8ba0ba] mt-0.5">{story.role}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${typeBadgeClass[story.type]}`}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {typeLabel[story.type]}
                </span>
              </div>

              <h3 className="text-lg sm:text-[1.26rem] font-semibold text-white tracking-tight leading-snug mb-3">
                {story.headline}
              </h3>

              <p className="text-[15px] text-[#9cb2cb] leading-relaxed mb-6">
                "{story.story}"
              </p>

              <div className="rounded-xl border border-[#253f5a] bg-[#0c1729] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#91a8c3] mb-1">
                  Outcome
                </p>
                <p className="text-sm font-semibold text-white">{story.metric}</p>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
