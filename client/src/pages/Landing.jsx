import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Film, Play, Zap, Users, FileCheck, ChevronRight, Upload,
  Bell, Lock, Sparkles, ArrowRight, ExternalLink, Star, Shield,
  Tv, TrendingUp, Award, Mail, Send,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.8, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ─── Floating Orb ─── */
const Orb = ({ className = "", size = 300, color = "cyan", delay = 0 }) => {
  const colors = {
    cyan: "rgba(0,240,255,0.07)",
    purple: "rgba(168,85,247,0.07)",
    orange: "rgba(249,115,22,0.05)",
    pink: "rgba(236,72,153,0.05)",
  };
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size, height: size,
        background: `radial-gradient(circle, ${colors[color]}, transparent 70%)`,
        filter: "blur(50px)",
      }}
      animate={{
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 10, -15, 0],
        scale: [1, 1.05, 0.95, 1.02, 1],
      }}
      transition={{ duration: 15 + delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};

/* ─── Counter Component ─── */
const AnimatedCounter = ({ value, suffix = "", prefix = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(value.replace(/\D/g, "")) || 0;
    const duration = 1500;
    const steps = 40;
    const increment = num / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), num);
      setDisplay(current.toLocaleString());
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{isInView ? display : "0"}{suffix}
    </span>
  );
};

/* ─── Typewriter Effect ─── */
const Typewriter = ({ lines, className = "" }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);

  useEffect(() => {
    if (currentLine >= lines.length) return;
    const line = lines[currentLine];
    if (currentChar < line.text.length) {
      const timer = setTimeout(() => setCurrentChar((c) => c + 1), 35);
      return () => clearTimeout(timer);
    } else {
      setDisplayedLines((prev) => [...prev, line]);
      const timer = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentLine, currentChar, lines]);

  return (
    <div className={className}>
      {displayedLines.map((line, i) => (
        <div key={i} className={line.className}>{line.text}</div>
      ))}
      {currentLine < lines.length && (
        <div className={lines[currentLine].className}>
          {lines[currentLine].text.slice(0, currentChar)}
          <span className="inline-block w-[2px] h-[14px] bg-[#1e3a5f] ml-0.5 align-middle animate-cursor-blink" />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
const Landing = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scriptLines = [
    { text: "SARAH (30) - Determined and passionate", className: "text-[#1e3a5f]/70 text-xs font-mono" },
    { text: "reviews her latest project in her home studio.", className: "text-gray-500 text-xs font-mono leading-relaxed" },
    { text: "", className: "h-1" },
    { text: "Upload to ScriptBridge...", className: "text-gray-500 text-xs font-mono leading-relaxed font-semibold text-[#1e3a5f]" },
  ];

  const features = [
    {
      icon: <Play className="w-6 h-6" />, num: "01",
      title: "Browse & Discover",
      desc: "Explore a curated collection of scripts, talent, and projects from creators around the world.",
      accent: "cyan", gradient: "from-[#1e3a5f]/10 to-[#2d5a8c]/10", iconBg: "bg-[#1e3a5f]/10", iconColor: "text-[#1e3a5f]",
    },
    {
      icon: <Zap className="w-6 h-6" />, num: "02",
      title: "Intelligent Matching",
      desc: "Our algorithm connects the right creators with the right opportunities based on expertise and interests.",
      accent: "purple", gradient: "from-[#1e3a5f]/10 to-[#2d5a8c]/10", iconBg: "bg-[#1e3a5f]/10", iconColor: "text-[#1e3a5f]",
    },
    {
      icon: <Users className="w-6 h-6" />, num: "03",
      title: "Collaborate Seamlessly",
      desc: "Built-in tools for communication, project management, and secure file sharing.",
      accent: "orange", gradient: "from-[#1e3a5f]/10 to-[#2d5a8c]/10", iconBg: "bg-[#1e3a5f]/10", iconColor: "text-[#1e3a5f]",
    },
    {
      icon: <FileCheck className="w-6 h-6" />, num: "04",
      title: "Track Success",
      desc: "Monitor your progress, analytics, and outcomes all in one professional dashboard.",
      accent: "emerald", gradient: "from-[#1e3a5f]/10 to-[#2d5a8c]/10", iconBg: "bg-[#1e3a5f]/10", iconColor: "text-[#1e3a5f]",
    },
  ];

  const steps = [
    { num: "01", icon: <Upload className="w-7 h-7" />, title: "Upload Your Work", desc: "Share your script, portfolio, or project details securely.", color: "cyan" },
    { num: "02", icon: <Bell className="w-7 h-7" />, title: "Get Matched", desc: "Our algorithm connects you with relevant opportunities.", color: "purple" },
    { num: "03", icon: <Lock className="w-7 h-7" />, title: "Collaborate & Grow", desc: "Work with industry professionals to bring your vision to life.", color: "cyan" },
  ];

  const trustedBy = ["Netflix", "A24", "HBO", "Paramount", "Lionsgate", "Sundance", "Warner Bros", "Disney"];

  return (
    <div className="bg-[#0a1628] text-white overflow-hidden relative">
      {/* Film grain overlay - subtle */}
      <div className="noise-overlay opacity-10" />

      {/* ═══ NAVIGATION ═══ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${navScrolled ? "glass-strong shadow-lg shadow-black/20" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Film className="w-8 h-8 text-[#1e3a5f] transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#1e3a5f]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="gradient-text-cyan">Script</span>
              <span className="text-white">Bridge</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#1e3a5f] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors hidden sm:inline-flex">
              Sign In
            </Link>
            <Link to="/join" className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5a8c] rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ SECTION 1 — HERO ═══ */}
      <section ref={heroRef} className="relative pt-32 pb-28 px-6 min-h-screen flex items-center overflow-hidden">
        <Orb size={600} color="cyan" className="top-[-200px] left-[-200px] opacity-20" delay={0} />
        <Orb size={500} color="purple" className="top-[15%] right-[-150px] opacity-20" delay={3} />
        <Orb size={400} color="pink" className="bottom-[-100px] left-[25%] opacity-20" delay={6} />

        {/* Grid pattern - subtle */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />

        <motion.div className="relative z-10 max-w-6xl mx-auto w-full" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center">
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold glass border border-[#1e3a5f]/30 text-[#1e3a5f]">
                <Sparkles className="w-4 h-4" />
                Professional Script Management
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] animate-pulse" />
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.92] mb-8 tracking-tight">
              <span className="block">Discover</span>
              <span className="block">the Perfect</span>
              <span className="block text-[#1e3a5f] mt-2">Script Match</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Connect brilliant creators with industry professionals. Upload scripts, discover talent, and build your next masterpiece.
            </motion.p>

            {/* Dual CTA */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/join" className="group relative px-10 py-4 bg-[#1e3a5f] hover:bg-[#2d5a8c] rounded-full text-lg font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-white">
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link to="/join" className="group px-10 py-4 glass rounded-full text-lg font-bold border border-[#1e3a5f]/30 hover:bg-[#1e3a5f]/10 transition-all duration-300 flex items-center justify-center gap-2">
                Explore Features
                <ExternalLink className="w-4 h-4 text-[#1e3a5f] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>

            {/* Trusted-by bar */}
            <motion.div variants={fadeUp} custom={4} className="mb-16">
              <p className="text-xs text-gray-600 uppercase tracking-[0.2em] font-medium mb-5">Trusted by teams at</p>
              <div className="marquee-container max-w-3xl mx-auto">
                <div className="marquee-track gap-12">
                  {[...trustedBy, ...trustedBy].map((name, i) => (
                    <span key={i} className="text-gray-600/60 text-sm font-semibold tracking-wider whitespace-nowrap uppercase flex-shrink-0 px-4">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Split-Screen Visual */}
            <motion.div variants={scaleIn} className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#1e3a5f]/10 via-[#1e3a5f]/5 to-[#1e3a5f]/10 rounded-3xl blur-xl opacity-40" />
              <div className="relative glass-card rounded-2xl p-1 overflow-hidden animate-border-glow">
                <div className="bg-[#0d1f35] rounded-xl overflow-hidden">
                  <div className="grid md:grid-cols-2 min-h-[380px]">
                    {/* Left: Script */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center border-r border-white/[0.05]">
                      <div className="mb-5 flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-[#1e3a5f] animate-pulse" />
                        Script Upload
                      </div>
                      <Typewriter lines={scriptLines} className="space-y-1.5" />
                    </div>

                    {/* Right: Match */}
                    <div className="p-8 lg:p-10 flex flex-col justify-center relative">
                      <div className="mb-5 flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-[#2d5a8c] animate-pulse" />
                        Smart Matching
                      </div>
                      <motion.div
                        className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-[#1e3a5f]/30 via-[#0d1f35] to-[#1e3a5f]/20"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 3.0, duration: 1 }}
                      >
                        {/* Skyline SVG */}
                        <div className="absolute bottom-0 inset-x-0 h-2/3">
                          <svg viewBox="0 0 400 120" className="w-full h-full opacity-20" preserveAspectRatio="none">
                            <rect x="5" y="30" width="20" height="90" rx="1" fill="rgba(30,58,95,0.3)" />
                            <rect x="30" y="50" width="18" height="70" rx="1" fill="rgba(45,90,140,0.25)" />
                            <rect x="55" y="15" width="28" height="105" rx="1" fill="rgba(30,58,95,0.2)" />
                            <rect x="90" y="55" width="20" height="65" rx="1" fill="rgba(45,90,140,0.2)" />
                            <rect x="120" y="8" width="32" height="112" rx="1" fill="rgba(30,58,95,0.25)" />
                            <rect x="160" y="40" width="24" height="80" rx="1" fill="rgba(45,90,140,0.2)" />
                            <rect x="195" y="20" width="28" height="100" rx="1" fill="rgba(30,58,95,0.22)" />
                            <rect x="230" y="58" width="20" height="62" rx="1" fill="rgba(45,90,140,0.25)" />
                            <rect x="260" y="12" width="30" height="108" rx="1" fill="rgba(30,58,95,0.2)" />
                            <rect x="300" y="35" width="22" height="85" rx="1" fill="rgba(45,90,140,0.2)" />
                            <rect x="335" y="48" width="18" height="72" rx="1" fill="rgba(30,58,95,0.18)" />
                            <rect x="365" y="25" width="30" height="95" rx="1" fill="rgba(45,90,140,0.25)" />
                          </svg>
                        </div>
                        {/* Scan line */}
                        <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#1e3a5f]/20 to-transparent animate-scan-line pointer-events-none" />
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#1e3a5f]/10 rounded-full animate-pulse-ring" style={{ width: 80, height: 80, top: -12, left: -12 }} />
                            <div className="w-14 h-14 bg-white/10 glass rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                              <Play className="w-5 h-5 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        {/* Cinematic bars */}
                        <div className="absolute top-0 inset-x-0 h-5 bg-gradient-to-b from-black/70 to-transparent" />
                        <div className="absolute bottom-0 inset-x-0 h-5 bg-gradient-to-t from-black/70 to-transparent" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Center transformation indicator */}
                  <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <motion.div
                      className="w-11 h-11 rounded-full bg-[#1e3a5f] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 2 — THE DIVIDE ═══ */}
      <section className="py-32 px-6 relative section-separator">
        <Orb size={350} color="orange" className="top-[-50px] right-[5%] opacity-15" delay={2} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 glass rounded-full text-[#1e3a5f] text-xs font-semibold mb-5 uppercase tracking-[0.15em] border border-[#1e3a5f]/30">
              The Opportunity
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5">
              Connect <span className="gradient-text-cyan">Creators</span> with Industry
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto font-light">
              Building bridges between brilliant talent and opportunities.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 gap-6 lg:gap-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            {/* Problem */}
            <motion.div variants={slideInLeft} className="group">
              <div className="glass-card rounded-2xl p-8 lg:p-10 h-full relative overflow-hidden border-l-4 border-l-[#1e3a5f]/40">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#1e3a5f]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#1e3a5f]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">The Challenge</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[17px] mb-8">
                    Many creators struggle to connect with industry professionals due to <span className="text-gray-300 font-medium">limited visibility and networks.</span>
                  </p>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="glass rounded-lg px-4 py-3 text-center flex-1 border border-[#1e3a5f]/20">
                      <div className="text-2xl font-bold text-[#1e3a5f]"><AnimatedCounter value="1000000" suffix="+" /></div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Limited Reach</div>
                    </div>
                    <div className="glass rounded-lg px-4 py-3 text-center flex-1 border border-[#1e3a5f]/20">
                      <div className="text-2xl font-bold text-[#1e3a5f]"><AnimatedCounter value="70" suffix="%" /></div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Hidden Talent</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Visibility", "Networking", "Opportunity"].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1e3a5f]/8 text-[#1e3a5f]/80 border border-[#1e3a5f]/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Solution */}
            <motion.div variants={slideInRight} className="group">
              <div className="glass-card rounded-2xl p-8 lg:p-10 h-full relative overflow-hidden border-l-4 border-l-[#2d5a8c]/40">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#1e3a5f]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-[#1e3a5f]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white gradient-text-cyan">Our Solution</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[17px] mb-8">
                    A central platform where creators publish their work and <span className="text-gray-300 font-medium">industry professionals discover new talent</span> effortlessly.
                  </p>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="glass rounded-lg px-4 py-3 text-center flex-1 neon-border-cyan border border-[#1e3a5f]/30">
                      <div className="text-2xl font-bold text-[#1e3a5f]"><AnimatedCounter value="24" suffix="hr" /></div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Quick Match</div>
                    </div>
                    <div className="glass rounded-lg px-4 py-3 text-center flex-1 neon-border-cyan border border-[#1e3a5f]/30">
                      <div className="text-2xl font-bold text-[#1e3a5f]"><AnimatedCounter value="95" suffix="%" /></div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Accuracy</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Intelligent Matching", "Easy Discovery", "Growth"].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#1e3a5f]/8 text-[#1e3a5f]/80 border border-[#1e3a5f]/15">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 3 — FEATURES GRID ═══ */}
      <section id="features" className="py-32 px-6 relative section-separator section-separator-purple">
        <Orb size={450} color="purple" className="bottom-[-100px] left-[-150px] opacity-15" delay={4} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 glass rounded-full text-[#1e3a5f] text-xs font-semibold mb-5 neon-border-purple uppercase tracking-[0.15em] border border-[#1e3a5f]/30">
              Core Features
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5">
              Built for <span className="gradient-text-cyan">Productivity</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
              Simple, powerful tools designed to help you succeed.
            </p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 gap-6" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp} className="group">
                <div className="glass-card rounded-2xl p-8 lg:p-10 h-full relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-xl ${f.iconBg} flex items-center justify-center ${f.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                        {f.icon}
                      </div>
                      <span className="text-4xl font-black text-white/[0.04] group-hover:text-white/[0.08] transition-colors select-none">{f.num}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{f.title}</h3>
                    <p className="text-gray-400 leading-relaxed text-[15px] group-hover:text-gray-300 transition-colors">{f.desc}</p>
                    <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 group-hover:text-[#1e3a5f] transition-colors">
                      Learn more <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 4 — HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-32 px-6 relative section-separator overflow-hidden">
        <Orb size={350} color="cyan" className="top-[20%] right-[0%] opacity-15" delay={1} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <span className="inline-block px-4 py-1.5 glass rounded-full text-[#1e3a5f] text-xs font-semibold mb-5 neon-border-cyan uppercase tracking-[0.15em] border border-[#1e3a5f]/30">
              Simple Workflow
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5">
              How It <span className="gradient-text-cyan">Works</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto font-light">
              Three simple steps to get started.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-[#1e3a5f]/20 via-[#1e3a5f]/20 to-[#1e3a5f]/20 rounded-full" />
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={i} className="relative"
                  initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp} custom={i}
                >
                  <div className="glass-card rounded-2xl p-8 text-center h-full">
                    {/* Step indicator */}
                    <div className="relative mb-8 flex justify-center">
                      <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#1e3a5f]/15 to-[#2d5a8c]/15 flex items-center justify-center text-[#1e3a5f] neon-border-cyan border border-[#1e3a5f]/30`}>
                        {step.icon}
                      </div>
                      <span className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] flex items-center justify-center text-[11px] font-bold shadow-lg text-white">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-[15px] leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5 — SOCIAL PROOF ═══ */}
      <section className="py-32 px-6 relative section-separator">
        <Orb size={400} color="purple" className="top-[10%] left-[2%] opacity-15" delay={5} />
        <Orb size={300} color="cyan" className="bottom-[10%] right-[5%] opacity-15" delay={8} />
        <div className="max-w-6xl mx-auto relative z-10 space-y-10">
          {/* For Creators */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <div className="glass-card rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/[0.03] via-transparent to-[#2d5a8c]/[0.03]" />
              <div className="relative z-10 p-10 md:p-14 md:flex items-center gap-14">
                <div className="flex-1 mb-10 md:mb-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                      <Star className="w-4 h-4 text-[#1e3a5f]" />
                    </div>
                    <span className="text-[#1e3a5f] text-xs font-bold uppercase tracking-[0.15em]">For Creators</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
                    Share your work with <span className="gradient-text-cyan">industry professionals</span>
                  </h3>
                  <p className="text-gray-400 text-[17px] leading-relaxed mb-8">
                    Upload your script, portfolio, or project details and get discovered by professionals actively looking for talent like you.
                  </p>
                  {/* Testimonial */}
                  <div className="glass rounded-xl p-5 mb-8 border border-[#1e3a5f]/20">
                    <p className="text-gray-300 text-sm italic leading-relaxed mb-3">
                      "I uploaded my work and was contacted by producers within a week. This platform changed everything for me."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] flex items-center justify-center text-[11px] font-bold text-white">SR</div>
                      <div>
                        <div className="text-xs font-semibold text-white">Sarah Rodriguez</div>
                        <div className="text-[10px] text-gray-500">Screenwriter</div>
                      </div>
                    </div>
                  </div>
                  <Link to="/join" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1e3a5f] hover:bg-[#2d5a8c] rounded-full font-bold text-white transition-all duration-300 hover:scale-105">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "500", suffix: "+", label: "Creators" },
                      { value: "5", suffix: "x", label: "More Reach" },
                      { value: "24", suffix: "hr", label: "Quick Response" },
                      { value: "92", suffix: "%", label: "Satisfaction" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-xl p-5 text-center neon-border-cyan min-w-[120px] border border-[#1e3a5f]/30">
                        <div className="text-2xl font-bold text-[#1e3a5f]">
                          <AnimatedCounter value={String(s.value)} suffix={s.suffix} />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Professionals */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}>
            <div className="glass-card glass-card-purple rounded-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/[0.03] via-transparent to-[#2d5a8c]/[0.03]" />
              <div className="relative z-10 p-10 md:p-14 md:flex flex-row-reverse items-center gap-14">
                <div className="flex-1 mb-10 md:mb-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                      <Award className="w-4 h-4 text-[#1e3a5f]" />
                    </div>
                    <span className="text-[#1e3a5f] text-xs font-bold uppercase tracking-[0.15em]">For Industry Professionals</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
                    Discover <span className="gradient-text-cyan">exceptional talent</span> effortlessly
                  </h3>
                  <p className="text-gray-400 text-[17px] leading-relaxed mb-8">
                    Browse curated profiles, discover fresh ideas, and connect with talented creators who match your project needs.
                  </p>
                  {/* Testimonial */}
                  <div className="glass rounded-xl p-5 mb-8 border border-[#1e3a5f]/20">
                    <p className="text-gray-300 text-sm italic leading-relaxed mb-3">
                      "Finding talent used to take months. Now I can discover and connect with creators in days."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8c] flex items-center justify-center text-[11px] font-bold text-white">JM</div>
                      <div>
                        <div className="text-xs font-semibold text-white">James Murphy</div>
                        <div className="text-[10px] text-gray-500">Producer</div>
                      </div>
                    </div>
                  </div>
                  <Link to="/join" className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1e3a5f] hover:bg-[#2d5a8c] rounded-full font-bold text-white transition-all duration-300 hover:scale-105">
                    Explore Talent <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "50", suffix: "+", label: "Professionals" },
                      { value: "85", suffix: "%", label: "Success Rate" },
                      { value: "10000", prefix: "+", suffix: "", label: "Connections" },
                      { value: "30", suffix: "-day", label: "Free Trial" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-xl p-5 text-center neon-border-purple min-w-[120px] border border-[#1e3a5f]/30">
                        <div className="text-2xl font-bold text-[#1e3a5f]">
                          <AnimatedCounter value={String(s.value)} suffix={s.suffix} prefix={s.prefix || ""} />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SECTION 6 — FOOTER ═══ */}
      <footer className="relative pt-24 pb-10 px-6">
        {/* Gradient separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e3a5f]/20 to-transparent" />
        <Orb size={250} color="cyan" className="bottom-0 left-[15%] opacity-15" delay={3} />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Final CTA */}
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-5">
              Ready to get <span className="gradient-text-cyan">started</span>?
            </h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg font-light">
              Join thousands of creators and professionals building something great.
            </p>
            {/* Newsletter */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3.5 glass rounded-full text-sm text-white placeholder-gray-500 border border-white/8 focus:border-[#1e3a5f]/40 focus:outline-none transition-colors bg-transparent"
                />
              </div>
              <Link to="/join" className="px-8 py-3.5 bg-[#1e3a5f] hover:bg-[#2d5a8c] rounded-full text-sm font-bold text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap">
                Get Started <Send className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Film className="w-5 h-5 text-[#1e3a5f]" />
                <span className="text-lg font-extrabold">
                  <span className="gradient-text-cyan">Script</span>
                  <span className="text-white">Bridge</span>
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Connecting creators with opportunities.
              </p>
            </div>

            {[
              { title: "Platform", links: ["About Us", "How It Works", "Features"] },
              { title: "Community", links: ["Creators", "Professionals", "Stories"] },
              { title: "Legal", links: ["Terms", "Privacy", "Security"] },
              { title: "Support", links: ["Help", "Contact", "Blog"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-xs text-gray-400 mb-4 uppercase tracking-[0.15em]">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-500 text-sm hover:text-[#1e3a5f] transition-colors duration-200">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2026 ScriptBridge. All rights reserved.</p>
            <div className="flex items-center gap-5">
              {/* Social Icons */}
              {[
                { name: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { name: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { name: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
              ].map((social) => (
                <a key={social.name} href="#" className="text-gray-600 hover:text-[#1e3a5f] transition-colors duration-200" aria-label={social.name}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d={social.path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
