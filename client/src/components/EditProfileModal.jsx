import { useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { AlertCircle, Building2, Linkedin, IndianRupee, Film, TrendingUp, Bell, User, CreditCard, Briefcase, Globe, Target, Heart } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext";
import { AuthContext } from "../context/AuthContext";

const GENRE_OPTIONS = [
  "Action", "Comedy", "Drama", "Horror", "Thriller",
  "Romance", "Sci-Fi", "Fantasy", "Mystery", "Adventure",
  "Crime", "Western", "Animation", "Documentary", "Historical",
  "War", "Musical", "Biographical", "Sports", "Political",
  "Legal", "Medical", "Supernatural", "Psychological", "Noir",
  "Family", "Teen", "Satire", "Dark Comedy", "Mockumentary"
];

const NUANCED_TAGS = [
  "Revenge", "Redemption", "Coming of Age", "Love Triangle", "Betrayal",
  "Family Drama", "Social Justice", "Identity Crisis", "Survival",
  "Power Struggle", "Forbidden Love", "Loss & Grief", "Ambition",
  "Good vs Evil", "Man vs Nature", "Isolation", "Corruption",
  "Second Chance", "Underdog Story", "Fish Out of Water", "Chosen One",
  "Quest", "Transformation", "Sacrifice", "Justice", "Freedom",
  "Urban", "Rural", "Suburban", "Space", "Historical", "Contemporary",
  "Post-Apocalyptic", "Dystopian", "Small Town", "Big City",
  "Wilderness", "Ocean/Sea", "Desert", "Jungle", "Medieval",
  "Future", "Alternate Reality", "Virtual Reality", "Underground",
  "Prison", "Hospital", "School/College", "Military Base",
  "Dark", "Satirical", "Gritty", "Lighthearted", "Noir",
  "Uplifting", "Tragic", "Suspenseful", "Whimsical", "Intense",
  "Edgy", "Heartwarming", "Cynical", "Hopeful", "Melancholic",
  "Surreal", "Cerebral", "Raw", "Poetic", "Epic"
];

const INVESTOR_GENRE_OPTIONS = [
  "Action", "Comedy", "Drama", "Horror", "Thriller",
  "Romance", "Sci-Fi", "Fantasy", "Mystery", "Documentary",
  "Crime", "Animation", "Historical", "Biographical", "Sports",
  "Family", "Musical", "War", "Western", "Adventure"
];

const BUDGET_TIERS = [
  { key: "micro", label: "Micro", range: "< ₹50L" },
  { key: "low", label: "Low", range: "₹50L – ₹2Cr" },
  { key: "medium", label: "Medium", range: "₹2Cr – ₹10Cr" },
  { key: "high", label: "High", range: "₹10Cr – ₹50Cr" },
  { key: "blockbuster", label: "Blockbuster", range: "₹50Cr+" },
];

const FORMAT_OPTIONS = [
  "Feature Film", "TV Pilot", "Web Series", "Documentary",
  "Short Film", "Anime", "Limited Series", "Reality Show"
];

const READER_GENRE_OPTIONS = [
  { label: "Action",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> },
  { label: "Comedy",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg> },
  { label: "Drama",        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
  { label: "Horror",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> },
  { label: "Thriller",     icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { label: "Romance",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> },
  { label: "Sci-Fi",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg> },
  { label: "Fantasy",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg> },
  { label: "Mystery",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
  { label: "Adventure",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg> },
  { label: "Crime",        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" /></svg> },
  { label: "Animation",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
  { label: "Documentary",  icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
  { label: "Historical",   icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg> },
  { label: "Biographical", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
  { label: "Sports",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg> },
  { label: "Musical",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.320.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" /></svg> },
  { label: "Family",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg> },
  { label: "Psychological",icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> },
  { label: "Dark Comedy",  icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg> },
];

const READER_CONTENT_TYPES = [
  { label: "feature_film",    display: "Feature Film",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg> },
  { label: "tv_pilot",        display: "TV Pilot",        icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg> },
  { label: "web_series",      display: "Web Series",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
  { label: "short_film",      display: "Short Film",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875C18 11.496 18.504 12 19.125 12M16.875 12h1.5M13.5 12h1.5" /></svg> },
  { label: "documentary",     display: "Documentary",     icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg> },
  { label: "animation",       display: "Animation",       icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg> },
  { label: "limited_series",  display: "Limited Series",  icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg> },
  { label: "reality_show",    display: "Reality Show",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
];

const EditProfileModal = ({ profile, onClose, onUpdate }) => {
  const { isDarkMode: dark } = useDarkMode();
  const { setUser } = useContext(AuthContext);
  const isWriter = profile.role === "creator" || profile.role === "writer";
  const isInvestor = profile.role === "investor";
  const wp = profile.writerProfile || {};
  const ip = profile.industryProfile || {};
  const mandates = ip.mandates || {};

  const READER_GENRE_OPTIONS = [
    "Action", "Comedy", "Drama", "Horror", "Thriller",
    "Romance", "Sci-Fi", "Fantasy", "Mystery", "Adventure",
    "Crime", "Animation", "Documentary", "Historical",
  ];

  const [formData, setFormData] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    skills: profile.skills?.join(", ") || "",
    profileImage: profile.profileImage || "",
    coverImage: profile.coverImage || "",
  });
  const [selectedFavoriteGenres, setSelectedFavoriteGenres] = useState(profile.favoriteGenres || []);
  const [coverPreview, setCoverPreview] = useState(
    profile.coverImage
      ? (profile.coverImage.startsWith("http") ? profile.coverImage : `http://localhost:5002${profile.coverImage}`)
      : ""
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  // Investor-specific state
  const [investorData, setInvestorData] = useState({
    company: ip.company || "",
    linkedInUrl: ip.linkedInUrl || "",
    investmentRange: "",
  });
  const [investorGenres, setInvestorGenres] = useState(mandates.genres || profile.preferences?.genres || []);
  const [investorBudgets, setInvestorBudgets] = useState(mandates.budgetTiers || []);
  const [investorFormats, setInvestorFormats] = useState(mandates.formats || []);
  const [notifPrefs, setNotifPrefs] = useState({
    smartMatchAlerts: profile.notificationPrefs?.smartMatchAlerts ?? true,
    auditionAlerts: profile.notificationPrefs?.auditionAlerts ?? true,
    holdAlerts: profile.notificationPrefs?.holdAlerts ?? true,
    viewAlerts: profile.notificationPrefs?.viewAlerts ?? true,
  });

  // Writer-specific state
  const [representationStatus, setRepresentationStatus] = useState(wp.representationStatus || "unrepresented");
  const [agencyName, setAgencyName] = useState(wp.agencyName || "");
  const [wgaMember, setWgaMember] = useState(wp.wgaMember || false);
  const [selectedGenres, setSelectedGenres] = useState(wp.genres || []);
  const [specializedTags, setSpecializedTags] = useState(wp.specializedTags || []);
  const [diversity, setDiversity] = useState({
    gender: wp.diversity?.gender || "",
    ethnicity: wp.diversity?.ethnicity || "",
  });
  const [showTagError, setShowTagError] = useState(false);

  // Reader preferences state
  const isReader = profile.role === "reader";
  const [readerGenres, setReaderGenres] = useState(profile.preferences?.genres || []);
  const [readerContentTypes, setReaderContentTypes] = useState(profile.preferences?.contentTypes || []);

  const toggleReaderGenre = (genre) => {
    setReaderGenres((prev) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };
  const toggleReaderContentType = (ct) => {
    setReaderContentTypes((prev) => prev.includes(ct) ? prev.filter(c => c !== ct) : [...prev, ct]);
  };

  // Bank details state
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: profile.bankDetails?.accountHolderName || "",
    bankName: profile.bankDetails?.bankName || "",
    accountNumber: profile.bankDetails?.accountNumber || "",
    routingNumber: profile.bankDetails?.routingNumber || "",
    accountType: profile.bankDetails?.accountType || "checking",
    swiftCode: profile.bankDetails?.swiftCode || "",
    iban: profile.bankDetails?.iban || "",
    country: profile.bankDetails?.country || "US",
    currency: profile.bankDetails?.currency || "USD"
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(profile.profileImage || "");
  const fileInputRef = useRef(null);

  // Active section for mobile-friendly navigation
  const [activeSection, setActiveSection] = useState("basic");

  const sections = isWriter
    ? [
      { key: "basic", label: "Basic", icon: <User size={13} /> },
      { key: "writer", label: "Writer", icon: <Briefcase size={13} /> },
      { key: "genres", label: "Genres", icon: <Film size={13} /> },
      { key: "tags", label: "Tags", icon: <Target size={13} /> },
      { key: "diversity", label: "Diversity", icon: <Heart size={13} /> },
      { key: "bank", label: "Banking", icon: <CreditCard size={13} /> },
    ]
    : isInvestor
      ? [
        { key: "basic", label: "Basic", icon: <User size={13} /> },
        { key: "investor", label: "Investor", icon: <TrendingUp size={13} /> },
        { key: "preferences", label: "Preferences", icon: <Film size={13} /> },
        { key: "notifications", label: "Alerts", icon: <Bell size={13} /> },
        { key: "bank", label: "Banking", icon: <CreditCard size={13} /> },
      ]
      : isReader
        ? [
          { key: "basic", label: "Basic", icon: <User size={13} /> },
          { key: "preferences", label: "Preferences", icon: <Film size={13} /> },
          { key: "bank", label: "Banking", icon: <CreditCard size={13} /> },
        ]
        : [
          { key: "basic", label: "Basic", icon: <User size={13} /> },
          { key: "bank", label: "Banking", icon: <CreditCard size={13} /> },
        ];

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleTag = (tag) => {
    if (specializedTags.includes(tag)) {
      setSpecializedTags(specializedTags.filter((t) => t !== tag));
    } else {
      if (specializedTags.length >= 5) {
        setShowTagError(true);
        setTimeout(() => setShowTagError(false), 2000);
        return;
      }
      setSpecializedTags([...specializedTags, tag]);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPEG, PNG, WebP and GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const { data } = await api.post("/users/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, profileImage: data.profileImage });
      setImagePreview(`http://localhost:5002${data.profileImage}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image");
      setImagePreview(profile.profileImage || "");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profileImage: "" });
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setError("Only JPEG, PNG, WebP images are allowed for cover"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Cover image must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingCover(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      const { data } = await api.post("/users/upload-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setFormData((prev) => ({ ...prev, coverImage: data.profileImage }));
      setCoverPreview(`http://localhost:5002${data.profileImage}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload cover image");
      setCoverPreview("");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const payload = {
        ...formData,
        skills: skillsArray,
        favoriteGenres: selectedFavoriteGenres,
      };

      if (isWriter) {
        payload.writerProfile = {
          representationStatus,
          agencyName,
          wgaMember,
          genres: selectedGenres,
          specializedTags,
          diversity,
        };
      }

      if (isInvestor) {
        payload.company = investorData.company;
        payload.linkedInUrl = investorData.linkedInUrl;
        payload.investmentRange = investorData.investmentRange;
        payload.preferredGenres = investorGenres;
        payload.preferredBudgets = investorBudgets;
        payload.preferredFormats = investorFormats;
        payload.notificationPrefs = notifPrefs;
      }

      // Reader preferences
      if (isReader) {
        payload.preferences = {
          genres: readerGenres,
          contentTypes: readerContentTypes,
        };
      }

      // Include bank details if any field is filled
      if (Object.values(bankDetails).some(val => val && val !== "checking" && val !== "US" && val !== "USD")) {
        payload.bankDetails = bankDetails;
      }

      const { data } = await api.put("/users/update", payload);
      // Sync AuthContext so ReaderHome / For You bar picks up new preferences
      setUser((prev) => prev ? { ...prev, ...data } : prev);
      onUpdate(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = imagePreview
    ? imagePreview.startsWith("data:") || imagePreview.startsWith("http")
      ? imagePreview
      : `http://localhost:5002${imagePreview}`
    : "";

  const inputClass = dark
    ? "w-full px-3.5 py-2.5 bg-[#242424] border border-[#444] rounded-lg text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500 focus:bg-[#101e30] transition-colors"
    : "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#111111] focus:bg-white transition-colors";
  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={`rounded-xl border w-full overflow-hidden ${dark ? 'bg-[#101e30] border-[#444]' : 'bg-white border-gray-200/80'}`}
        style={{ maxWidth: isInvestor ? "580px" : "520px", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? 'border-[#333]' : 'border-gray-100'}`}>
          <h2 className={`text-base font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Edit Profile</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section Tabs */}
        {sections.length > 1 && (
          <div className="flex items-center gap-1 px-5 pt-3 pb-2 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSection(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeSection === s.key
                    ? "bg-[#0f2544] text-white shadow-lg shadow-[#0f2544]/20"
                    : dark ? "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-5 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(90vh - 130px)" }}>
          {/* === BASIC SECTION === */}
          {activeSection === "basic" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Profile Image Upload */}
              <div>
                <label className={labelClass}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Profile"
                        className="w-[72px] h-[72px] rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-full bg-[#111111]/10 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#111111]">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3.5 py-1.5 bg-[#111111] text-white rounded-lg text-xs font-semibold hover:bg-[#000000] transition-colors disabled:opacity-50"
                    >
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </button>
                    {displayImage && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${dark ? 'bg-[#242424] text-gray-400 border-[#444] hover:text-red-400 hover:border-red-500/40' : 'bg-white text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200'}`}
                      >
                        Remove
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400">JPG, PNG, WebP or GIF. Max 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows="3"
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                />
                <p className="text-[10px] text-gray-400 mt-1">{formData.bio.length}/500</p>
              </div>

              <div>
                <label className={labelClass}>Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className={inputClass}
                  placeholder="Writing, Directing, Acting"
                />
                <p className="text-[11px] text-gray-400 mt-1">Separate skills with commas</p>
              </div>

              {/* Cover Image */}
              <div>
                <label className={labelClass}>Cover Image</label>
                <div className={`relative w-full h-24 rounded-xl overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                  dark ? "border-[#444] bg-[#242424] hover:border-[#666]" : "border-gray-200 bg-gray-50 hover:border-gray-400"
                }`} onClick={() => coverInputRef.current?.click()}>
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Change cover</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${dark ? "text-gray-500" : "text-gray-400"}`}>Click to upload cover image</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Recommended 1200×400px</p>
                    </div>
                  )}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
                {coverPreview && (
                  <button type="button" onClick={() => { setCoverPreview(""); setFormData((p) => ({ ...p, coverImage: "" })); }}
                    className={`mt-1.5 text-[11px] font-semibold transition-colors ${dark ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600"}`}>
                    Remove cover
                  </button>
                )}
              </div>

              {/* Favourite Genres (reader/all roles) */}
              <div>
                <label className={labelClass}>Favourite Genres</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {READER_GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedFavoriteGenres((prev) =>
                        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                      )}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedFavoriteGenres.includes(g)
                          ? "bg-[#111111] text-white border-[#111111]"
                          : dark
                          ? "bg-white/[0.04] text-gray-400 border-[#444] hover:border-[#666]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-[#111111]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {selectedFavoriteGenres.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1.5">{selectedFavoriteGenres.length} selected</p>
                )}
              </div>
            </motion.div>
          )}

          {/* === WRITER DETAILS SECTION === */}
          {activeSection === "writer" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Writer Details</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Professional information visible to industry contacts</p>
              </div>

              <div>
                <label className={labelClass}>Representation Status</label>
                <select
                  value={representationStatus}
                  onChange={(e) => setRepresentationStatus(e.target.value)}
                  className={inputClass}
                >
                  <option value="unrepresented">Unrepresented</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                  <option value="manager_and_agent">Manager & Agent</option>
                </select>
              </div>

              {(representationStatus === "agent" || representationStatus === "manager_and_agent") && (
                <div>
                  <label className={labelClass}>Agency Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., CAA, WME, UTA"
                  />
                </div>
              )}

              <div className={`flex items-center gap-3 p-3 rounded-lg border ${dark ? 'bg-white/[0.03] border-[#444]' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  type="checkbox"
                  id="wgaMemberEdit"
                  checked={wgaMember}
                  onChange={(e) => setWgaMember(e.target.checked)}
                  className="w-5 h-5 text-[#1a365d] border-gray-300 rounded focus:ring-[#1a365d]"
                />
                <label htmlFor="wgaMemberEdit" className={`text-sm font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  I am a WGA member
                </label>
              </div>
            </motion.div>
          )}

          {/* === GENRES SECTION === */}
          {activeSection === "genres" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Primary Genres</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select all genres that apply to your work</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all border-2 ${selectedGenres.includes(genre)
                        ? "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-[#242424] text-gray-300 border-[#444] hover:border-blue-500" : "bg-white text-gray-700 border-gray-200 hover:border-[#1a365d]"
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-[#0f2544]">{selectedGenres.length}</span> genre{selectedGenres.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </motion.div>
          )}

          {/* === SPECIALIZED TAGS SECTION === */}
          {activeSection === "tags" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Specialized Tags</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Choose themes, tones, or settings you specialize in (max 5)
                </p>
              </div>

              <AnimatePresence>
                {showTagError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg"
                  >
                    <AlertCircle size={14} />
                    <span>Please choose your top 5 only.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg ${dark ? 'border-[#444] bg-[#242424]' : 'border-gray-200 bg-gray-50'}`}>
                {NUANCED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${specializedTags.includes(tag)
                        ? "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-[#101e30] text-gray-300 border-[#444] hover:border-blue-500" : "bg-white text-gray-700 border-gray-200 hover:border-[#1a365d]"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 flex items-center justify-between">
                <span>{specializedTags.length}/5 tags selected</span>
                {specializedTags.length > 0 && (
                  <span className="font-medium text-[#0f2544]">{specializedTags.join(", ")}</span>
                )}
              </p>
            </motion.div>
          )}

          {/* === DIVERSITY SECTION === */}
          {activeSection === "diversity" && isWriter && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Diversity Information</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Optional — helps producers find underrepresented voices
                </p>
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <input
                  type="text"
                  value={diversity.gender}
                  onChange={(e) => setDiversity({ ...diversity, gender: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className={labelClass}>Ethnicity</label>
                <input
                  type="text"
                  value={diversity.ethnicity}
                  onChange={(e) => setDiversity({ ...diversity, ethnicity: e.target.value })}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>
            </motion.div>
          )}

          {/* === INVESTOR DETAILS SECTION === */}
          {activeSection === "investor" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Investor Profile</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Business details visible to creators and writers</p>
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Building2 size={12} /> Company / Firm</span>
                </label>
                <input
                  type="text"
                  value={investorData.company}
                  onChange={(e) => setInvestorData({ ...investorData, company: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Yash Raj Films, Dharma Productions"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Linkedin size={12} /> LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  value={investorData.linkedInUrl}
                  onChange={(e) => setInvestorData({ ...investorData, linkedInUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><IndianRupee size={12} /> Investment Range</span>
                </label>
                <select
                  value={investorData.investmentRange}
                  onChange={(e) => setInvestorData({ ...investorData, investmentRange: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select typical investment range</option>
                  <option value="under_50l">Under ₹50 Lakhs</option>
                  <option value="50l_2cr">₹50 Lakhs – ₹2 Crore</option>
                  <option value="2cr_10cr">₹2 Crore – ₹10 Crore</option>
                  <option value="10cr_50cr">₹10 Crore – ₹50 Crore</option>
                  <option value="50cr_plus">₹50 Crore+</option>
                </select>
              </div>

              <div className={`flex items-start gap-2.5 p-3 rounded-lg ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                <TrendingUp size={16} className={`mt-0.5 shrink-0 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <p className={`text-xs ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Complete your investor profile to get better script recommendations and connect with relevant creators.
                </p>
              </div>
            </motion.div>
          )}

          {/* === INVESTOR PREFERENCES SECTION === */}
          {activeSection === "preferences" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Preferred Genres */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Preferred Genres</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Select genres you're interested in investing in</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INVESTOR_GENRE_OPTIONS.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setInvestorGenres((prev) => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre])}
                      className={`px-2.5 py-2 rounded-lg font-medium text-xs transition-all border ${investorGenres.includes(genre)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {investorGenres.length > 0 && (
                  <p className={`text-xs mt-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="font-semibold text-[#0f2544]">{investorGenres.length}</span> genre{investorGenres.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Budget Tiers */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Budget Tiers</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What budget ranges interest you?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUDGET_TIERS.map((tier) => (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => setInvestorBudgets((prev) => prev.includes(tier.key) ? prev.filter(b => b !== tier.key) : [...prev, tier.key])}
                      className={`px-3 py-2.5 rounded-lg text-xs transition-all border text-left ${investorBudgets.includes(tier.key)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      <span className="font-bold block">{tier.label}</span>
                      <span className={`text-[10px] ${investorBudgets.includes(tier.key) ? 'text-white/60' : dark ? 'text-gray-600' : 'text-gray-400'}`}>{tier.range}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Formats */}
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Content Formats</h3>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What types of content do you fund?</p>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setInvestorFormats((prev) => prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt])}
                      className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all border ${investorFormats.includes(fmt)
                        ? dark ? "bg-[#0f2544] text-white border-[#1e3a5f] shadow-md shadow-[#0f2544]/20" : "bg-[#0f2544] text-white border-[#0f2544]"
                        : dark ? "bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50" : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* === NOTIFICATION PREFERENCES SECTION === */}
          {activeSection === "notifications" && isInvestor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Notification Preferences</h3>
                <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Control which alerts you receive</p>
              </div>

              {[
                { key: "smartMatchAlerts", label: "Smart Match Alerts", desc: "Get notified when scripts match your preferences" },
                { key: "holdAlerts", label: "Hold Updates", desc: "Updates when scripts you've held have changes" },
                { key: "viewAlerts", label: "Profile Views", desc: "Know when creators view your investor profile" },
                { key: "auditionAlerts", label: "Audition Alerts", desc: "Notifications about audition opportunities" },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${dark
                    ? notifPrefs[item.key] ? 'bg-[#0f2544]/30 border-[#1e3a5f]/40' : 'bg-white/[0.02] border-[#333] hover:border-[#444]'
                    : notifPrefs[item.key] ? 'bg-[#1e3a5f]/[0.04] border-[#1e3a5f]/20' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${dark ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</p>
                    <p className={`text-[11px] mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.key]}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${notifPrefs[item.key]
                      ? 'bg-[#1e3a5f]'
                      : dark ? 'bg-[#333]' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[item.key] ? 'translate-x-4' : ''}`} />
                    </div>
                  </div>
                </label>
              ))}
            </motion.div>
          )}

          {/* === READER PREFERENCES SECTION === */}
          {activeSection === "preferences" && isReader && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Genres */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Favourite Genres</h3>
                  {readerGenres.length > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${dark ? 'bg-[#1e3a5f]/30 text-[#7aafff]' : 'bg-[#1e3a5f]/10 text-[#1e3a5f]'}`}>
                      {readerGenres.length} selected
                    </span>
                  )}
                </div>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Tap to select genres you love — we'll show those scripts first</p>
                <div className="grid grid-cols-2 gap-2">
                  {READER_GENRE_OPTIONS.map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleReaderGenre(label)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all border-2 text-left ${
                        readerGenres.includes(label)
                          ? dark
                            ? 'bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md shadow-[#1e3a5f]/30'
                            : 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : dark
                            ? 'bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50 hover:text-gray-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900'
                      }`}
                    >
                      <span className="shrink-0">{icon}</span>
                      <span>{label}</span>
                      {readerGenres.includes(label) && (
                        <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {readerGenres.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReaderGenres([])}
                    className={`mt-2 text-[11px] font-semibold hover:underline ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Content Types */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Content Types</h3>
                  {readerContentTypes.length > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${dark ? 'bg-[#1e3a5f]/30 text-[#7aafff]' : 'bg-[#1e3a5f]/10 text-[#1e3a5f]'}`}>
                      {readerContentTypes.length} selected
                    </span>
                  )}
                </div>
                <p className={`text-xs mb-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>What formats do you enjoy watching?</p>
                <div className="grid grid-cols-2 gap-2">
                  {READER_CONTENT_TYPES.map(({ label, display, icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleReaderContentType(label)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs transition-all border-2 text-left ${
                        readerContentTypes.includes(label)
                          ? dark
                            ? 'bg-[#1e3a5f] text-white border-[#3a7bd5] shadow-md shadow-[#1e3a5f]/30'
                            : 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : dark
                            ? 'bg-white/[0.03] text-gray-400 border-[#333] hover:border-[#1e3a5f]/50 hover:text-gray-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]/40 hover:text-gray-900'
                      }`}
                    >
                      <span className="shrink-0">{icon}</span>
                      <span>{display}</span>
                      {readerContentTypes.includes(label) && (
                        <svg className="w-3 h-3 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                {readerContentTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setReaderContentTypes([])}
                    className={`mt-2 text-[11px] font-semibold hover:underline ${dark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Summary banner */}
              {(readerGenres.length > 0 || readerContentTypes.length > 0) && (
                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  dark ? 'bg-[#1e3a5f]/10 border-[#1e3a5f]/25' : 'bg-[#1e3a5f]/[0.04] border-[#1e3a5f]/15'
                }`}>
                  <svg className={`w-4 h-4 mt-0.5 shrink-0 ${dark ? 'text-[#7aafff]' : 'text-[#1e3a5f]'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <p className={`text-xs leading-relaxed ${dark ? 'text-[#7aafff]/70' : 'text-[#1e3a5f]/70'}`}>
                    Your home feed will prioritise <strong>{readerGenres.length > 0 ? readerGenres.slice(0, 3).join(", ") : ""}{readerGenres.length > 3 ? ` +${readerGenres.length - 3} more` : ""}</strong>{readerGenres.length > 0 && readerContentTypes.length > 0 ? " · " : ""}<strong>{readerContentTypes.length > 0 ? readerContentTypes.map(c => READER_CONTENT_TYPES.find(x => x.label === c)?.display).join(", ") : ""}</strong> content.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* === BANK DETAILS SECTION === */}
          {activeSection === "bank" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <h3 className={`text-sm font-bold mb-1 ${dark ? 'text-gray-100' : 'text-gray-900'}`}>Bank Account Details</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Secure payment information for receiving funds
                </p>
              </div>

              <div>
                <label className={labelClass}>Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  className={inputClass}
                  placeholder="Full name as it appears on your account"
                />
              </div>

              <div>
                <label className={labelClass}>Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className={inputClass}
                  placeholder="e.g., Wells Fargo, Chase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input
                    type="password"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className={inputClass}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className={labelClass}>Routing Number</label>
                  <input
                    type="text"
                    value={bankDetails.routingNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                    className={inputClass}
                    placeholder="9-digit routing"
                    maxLength="9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Account Type</label>
                  <select
                    value={bankDetails.accountType}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                    className={inputClass}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    type="text"
                    value={bankDetails.country}
                    onChange={(e) => setBankDetails({ ...bankDetails, country: e.target.value })}
                    className={inputClass}
                    placeholder="US"
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <input
                    type="text"
                    value={bankDetails.currency}
                    onChange={(e) => setBankDetails({ ...bankDetails, currency: e.target.value })}
                    className={inputClass}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className={`p-3 rounded-lg ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  International Transfers (Optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>SWIFT Code</label>
                    <input
                      type="text"
                      value={bankDetails.swiftCode}
                      onChange={(e) => setBankDetails({ ...bankDetails, swiftCode: e.target.value })}
                      className={inputClass}
                      placeholder="e.g., CHASUS33"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>IBAN</label>
                    <input
                      type="text"
                      value={bankDetails.iban}
                      onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                      className={inputClass}
                      placeholder="International number"
                    />
                  </div>
                </div>
              </div>

              <div className={`flex items-start gap-2 p-3 rounded-lg ${dark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
                <svg className={`w-4 h-4 mt-0.5 shrink-0 ${dark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <p className={`text-xs ${dark ? 'text-blue-300' : 'text-blue-700'}`}>
                  All bank details are encrypted and stored securely. This information is used only for payment processing.
                </p>
              </div>
            </motion.div>
          )}

          {/* Action Buttons - always visible */}
          <div className={`flex items-center gap-2.5 pt-3 border-t ${dark ? 'border-[#333]' : 'border-gray-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${dark ? 'bg-[#242424] text-gray-300 border-[#444] hover:bg-[#333]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2.5 bg-[#111111] text-white rounded-lg hover:bg-[#000000] transition-colors disabled:opacity-50 text-sm font-bold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfileModal;
