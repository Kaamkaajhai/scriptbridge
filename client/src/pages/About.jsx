import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import MarketingHeader from "../components/MarketingHeader";
import aboutHero from "../assets/about_hero.png";
import ckriptVideo from "../assets/ckript-video.mp4";

const FontInjection = () => (
	<style>{`
		@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,500;1,9..144,700&family=Inter:wght@300;400;500;600;700&display=swap');

		.font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
		.font-body { font-family: 'Inter', system-ui, sans-serif; }

		.grain::before {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			opacity: 0.05;
			mix-blend-mode: overlay;
			background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		}

		.about-glow {
			position: absolute;
			border-radius: 9999px;
			filter: blur(68px);
			opacity: 0.42;
			pointer-events: none;
		}
	`}</style>
);

const About = () => {
	const [isVideoPlaying, setIsVideoPlaying] = useState(false);
	const videoRef = useRef(null);

	const handleVideoOverlayClick = () => {
		const video = videoRef.current;
		if (!video) return;

		setIsVideoPlaying(true);
		const playPromise = video.play();
		if (playPromise && typeof playPromise.catch === "function") {
			playPromise.catch(() => setIsVideoPlaying(false));
		}
	};

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-white text-[#0f172a]">
			<FontInjection />
			<div className="pointer-events-none fixed inset-0 z-0">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(99,102,241,0.10),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(59,130,246,0.12),transparent_38%)]" />
				<div className="about-glow left-[-120px] top-[200px] h-[320px] w-[320px] bg-[#93c5fd]" />
				<div className="about-glow right-[-90px] top-[80px] h-[280px] w-[280px] bg-[#c4b5fd]" />
			</div>

			<MarketingHeader />

			<section className="relative z-10 px-4 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32">
				<div className="mx-auto w-full max-w-6xl">
					<p className="font-body flex w-full justify-center text-center px-4 py-1.5 text-[32px] font-bold uppercase tracking-[0.16em] text-black sm:text-[40px]">
						About Ckript
					</p>

					<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-10">
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45 }}
							className="hidden lg:col-span-3 lg:block"
						>
							<h1 className="font-display text-[#0f172a] text-3xl leading-[0.98] tracking-tight sm:text-5xl">
								About Ckript
							</h1>
							<p className="font-body mt-5 text-sm leading-relaxed text-[#0f172a] sm:text-base">
								Ckript is a next-generation digital platform designed to bridge the gap between talented storytellers and industry decision-makers. It enables writers to create and showcase scripts across multiple formats, including films, web series, anime, television, cartoons, and more, within a secure and structured ecosystem.
							</p>
							<p className="font-body mt-3 text-sm leading-relaxed text-[#334155] sm:text-base">
								At its core, Ckript is built to solve one of the biggest challenges in the entertainment industry: discoverability with trust.
							</p>
							<p className="font-body mt-3 text-sm leading-relaxed text-[#334155] sm:text-base">
								Every script uploaded to the platform is securely protected to ensure full ownership and intellectual property safety for writers. To enhance visibility and evaluation, Ckript leverages advanced AI to transform scripts into visual trailers and generate insightful evaluation scores, enabling faster and more informed decision-making.
							</p>
							<p className="font-body mt-3 text-sm leading-relaxed text-[#0f172a] sm:text-base">
								Producers and directors can seamlessly explore curated content through trailers, structured insights, and concise summaries. Based on this initial evaluation, they can request access to full scripts, ensuring that only serious and relevant interest leads to deeper engagement.
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 14 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.1 }}
							className="relative overflow-hidden rounded-3xl bg-[#0d1b2e] shadow-[0_22px_40px_rgba(3,10,26,0.5)] min-h-[620px] sm:min-h-[700px] md:min-h-[760px] lg:min-h-[250px] lg:col-span-2 max-[510px]:min-h-0 max-[510px]:bg-transparent max-[510px]:shadow-none"
						>
							<img
								src={aboutHero}
								alt="Ckript marketplace visual"
								className="h-full min-h-[250px] w-full object-cover max-[510px]:hidden"
								loading="eager"
							/>

							<div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0d1b2e]/90 via-[#102540]/75 to-[#0d1b2e]/92 p-5 text-white overflow-y-auto sm:p-8 lg:hidden max-[510px]:static max-[510px]:inset-auto max-[510px]:overflow-visible max-[510px]:bg-transparent max-[510px]:from-transparent max-[510px]:via-transparent max-[510px]:to-transparent max-[510px]:p-0 max-[510px]:text-[#0f172a]">
								<h1 className="font-display text-3xl leading-[0.98] tracking-tight sm:text-5xl max-[510px]:text-[#0f172a]">
									About Ckript
								</h1>
								<p className="font-body mt-5 text-sm leading-relaxed text-[#ffffff] sm:text-base max-[510px]:text-[#334155]">
									Ckript is a next-generation digital platform designed to bridge the gap between talented storytellers and industry decision-makers. It enables writers to create and showcase scripts across multiple formats, including films, web series, anime, television, cartoons, and more, within a secure and structured ecosystem.
								</p>
								<p className="font-body mt-3 text-sm leading-relaxed text-[#ffffff] sm:text-base max-[510px]:text-[#334155]">
									At its core, Ckript is built to solve one of the biggest challenges in the entertainment industry: discoverability with trust.
								</p>
								<p className="font-body mt-3 text-sm leading-relaxed text-[#ffffff] sm:text-base max-[510px]:text-[#334155]">
									Every script uploaded to the platform is securely protected to ensure full ownership and intellectual property safety for writers. To enhance visibility and evaluation, Ckript leverages advanced AI to transform scripts into visual trailers and generate insightful evaluation scores, enabling faster and more informed decision-making.
								</p>
								<p className="font-body mt-3 text-sm leading-relaxed text-[#ffffff] sm:text-base max-[510px]:text-[#334155]">
									Producers and directors can seamlessly explore curated content through trailers, structured insights, and concise summaries. Based on this initial evaluation, they can request access to full scripts, ensuring that only serious and relevant interest leads to deeper engagement.
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			<section className="relative z-10 px-4 pb-10 sm:px-8 sm:pb-14">
				<div className="mx-auto w-full max-w-6xl">
					<motion.div
						initial={{ opacity: 0, y: 14 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.45 }}
						className="mb-6 sm:mb-8"
					>
						<p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
							Guiding Principles
						</p>
						<h2 className="font-display mt-2 text-3xl leading-tight text-[#0f172a] sm:text-5xl">
							Mission <span className="text-[#94a3b8]">and</span> Vision
						</h2>
					</motion.div>

					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<motion.article
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.45 }}
							className="group relative overflow-hidden rounded-[30px] border border-[#d7e4f3] bg-[linear-gradient(160deg,#ffffff_0%,#f8fbff_62%,#eff5fc_100%)] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.10)] sm:p-8"
						>
							<div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#93c5fd]/35 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />
							<div className="relative z-10">
								<span className="font-body inline-flex items-center rounded-full border border-[#c7dbf0] bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#315b86]">
									01 • Our Mission
								</span>
								<p className="font-body mt-4 text-sm leading-relaxed text-[#334155] sm:text-base">
									Our mission is to build a trusted, intelligent ecosystem where great stories are discovered on merit, creators retain full control of their work, and industry professionals can efficiently access high-quality, production-ready content.
								</p>
							</div>
						</motion.article>

						<motion.article
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.45, delay: 0.08 }}
							className="group relative overflow-hidden rounded-[30px] border border-[#ddd9ff] bg-[linear-gradient(160deg,#ffffff_0%,#fbfaff_58%,#f3efff_100%)] p-6 shadow-[0_18px_42px_rgba(15,23,42,0.10)] sm:p-8"
						>
							<div className="pointer-events-none absolute -left-16 -bottom-20 h-52 w-52 rounded-full bg-[#c4b5fd]/35 blur-3xl transition-opacity duration-300 group-hover:opacity-90" />
							<div className="relative z-10">
								<span className="font-body inline-flex items-center rounded-full border border-[#dbd2ff] bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#5b4ca4]">
									02 • Our Vision
								</span>
								<p className="font-body mt-4 text-sm leading-relaxed text-[#334155] sm:text-base">
									Our vision is to redefine the entertainment ecosystem by making script discovery intelligent, secure, and accessible, unlocking opportunities for creators and reshaping how content is found and produced worldwide.
								</p>
							</div>
						</motion.article>
					</div>
				</div>
			</section>

			<section className="relative z-10 px-4 pb-10 sm:px-8 sm:pb-14">
				<div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[#29405c] bg-[#0f1a2d] shadow-[0_22px_40px_rgba(3,10,26,0.5)]">
					<div className="relative">
						<video
							ref={videoRef}
							controls
							controlsList="nodownload"
							playsInline
							preload="metadata"
							onPlay={() => setIsVideoPlaying(true)}
							onPause={() => setIsVideoPlaying(false)}
							onEnded={() => setIsVideoPlaying(false)}
							className="h-full max-h-[560px] w-full bg-black/90"
							aria-label="How to use Ckript platform video"
						>
							<source src={ckriptVideo} type="video/mp4" />
							Your browser does not support the video tag.
						</video>

						<div
							className={`absolute inset-0 transition-opacity duration-300 ${isVideoPlaying ? "opacity-0 pointer-events-none" : "opacity-100"}`}
						>
							<div className="absolute inset-0 bg-gradient-to-t from-[#050b15]/90 via-[#0d1a2f]/60 to-[#2e5f8f]/35" />
							<button
								type="button"
								onClick={handleVideoOverlayClick}
								className="relative z-10 flex h-full w-full items-center justify-center p-5 text-center sm:p-8"
								aria-label="Play platform walkthrough video"
							>
								<div className="max-w-4xl">
									<div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-sm">
										<svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
											<path d="M8 6v12l10-6z" />
										</svg>
									</div>
									<h2 className="font-display text-4xl leading-tight text-white sm:text-6xl">
										How to Use the Platform
									</h2>
									<p className="font-body mt-4 sm:mt-5 text-sm leading-relaxed text-[#d6e4f3] sm:text-lg">
										Watch this quick walkthrough to understand how writers can upload securely and how producers can discover and evaluate scripts efficiently.
									</p>
								</div>
							</button>
						</div>
					</div>
				</div> 
			</section>

			<footer className="relative z-10 border-t border-[#1f2f45] bg-[linear-gradient(180deg,#0b1323_0%,#0a1020_100%)] px-4 py-8 sm:px-8 sm:py-10">
				<div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="font-body mt-1 text-xs text-[#9cb1c9]">&copy; 2026 Ckript. All rights reserved.</p>
					</div>

					<div className="font-body flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9cb1c9] sm:text-sm">
						<Link to="/about" className="transition-colors hover:text-white">About</Link>
						<Link to="/contact" className="transition-colors hover:text-white">Contact</Link>
						<Link to="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link>
						<Link to="/terms-of-service" className="transition-colors hover:text-white">Terms of Service</Link>
					</div>
				</div>
			</footer>

		</div>
	);
};

export default About;
