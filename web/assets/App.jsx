import React, { useEffect, useState } from "react";
import AOS from "aos";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import "./aos.css";
import {
  Terminal,
  Cpu,
  Layers,
  Box,
  Zap,
  ShieldCheck,
  Globe,
  Smartphone,
  GitBranch,
  Copy,
  CheckCircle2,
  Download,
  Command,
  FileCode,
  Settings,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Newspaper,
  Palette,
  Package,
  Wrench,
  Code2,
  HeartHandshake,
} from "lucide-react";

const features = [
  {
    icon: <Zap />,
    title: "Instant Scaffolding",
    desc: "Generate Android, hybrid, native, and frontend project structures in seconds.",
  },
  {
    icon: <Globe />,
    title: "WebView and Web APK",
    desc: "Turn a website or frontend stack into an Android package with a clean workflow.",
  },
  {
    icon: <Smartphone />,
    title: "Native Starter",
    desc: "Use a practical Android boilerplate designed for clarity and maintainability.",
  },
  {
    icon: <Code2 />,
    title: "C and C++ Templates",
    desc: "Create native game and app scaffolds with CMake and Make support.",
  },
  {
    icon: <ShieldCheck />,
    title: "Signing Scaffold",
    desc: "Prepare release signing files and keystore configuration with simple CLI input.",
  },
  {
    icon: <Settings />,
    title: "Smart CLI Prompts",
    desc: "Use prompts-based interactive input with better debug-friendly output.",
  },
  {
    icon: <Palette />,
    title: "Modern Frontend Stack",
    desc: "React, Vue, Angular, and Preact templates use Vite and modern frontend defaults.",
  },
  {
    icon: <Package />,
    title: "Web APK UI Stack",
    desc: "Tailwind CSS, Material UI, and Material Icons support for web-focused APK projects.",
  },
  {
    icon: <Wrench />,
    title: "XML to JSON Helper",
    desc: "Generate and use XML-to-JSON helpers for Web APK workflows when needed.",
  },
];

const templates = [
  {
    icon: <Layers />,
    name: "WebView",
    desc: "Android container for websites with navigation, loading, and offline-friendly structure.",
  },
  {
    icon: <Globe />,
    name: "Web APK",
    desc: "Frontend-driven APK template with Tailwind, Material UI, and XML2JSON support.",
  },
  {
    icon: <Smartphone />,
    name: "Native",
    desc: "Minimal Android starter for straightforward app development.",
  },
  {
    icon: <Code2 />,
    name: "Kotlin",
    desc: "Optimized Kotlin template for clean and practical Android workflows.",
  },
  {
    icon: <Cpu />,
    name: "Compose",
    desc: "Jetpack Compose starter with modern Android UI defaults.",
  },
  {
    icon: <Box />,
    name: "Game Java",
    desc: "Canvas-style game scaffold for Java-based Android projects.",
  },
  {
    icon: <Code2 />,
    name: "Game C++",
    desc: "Native game scaffold with CMake integration and C/C++ support.",
  },
  {
    icon: <Package />,
    name: "React",
    desc: "Vite-powered React template for web and Android-integrated workflows.",
  },
  {
    icon: <Package />,
    name: "Vue",
    desc: "Vite-powered Vue template for modern frontend scaffolding.",
  },
  {
    icon: <Package />,
    name: "Angular",
    desc: "TypeScript-first Angular template with Vite optimization.",
  },
  {
    icon: <Package />,
    name: "Preact",
    desc: "Lightweight Vite-powered Preact template for compact frontend builds.",
  },
  {
    icon: <FileCode />,
    name: "C",
    desc: "Native C template with CMake and Make scaffolding.",
  },
  {
    icon: <FileCode />,
    name: "C++",
    desc: "Native C++ template with CMake and Make scaffolding.",
  },
];

const commands = [
  {
    cmd: "new",
    args: "--name, --package, --template, --min-sdk, --target-sdk, --compile-sdk",
    desc: "Creates a new project from a template with interactive or flag-based input.",
  },
  {
    cmd: "build",
    args: "[projectDir], --variant, --gradle-version",
    desc: "Builds an existing project into an APK using the available Gradle setup.",
  },
  {
    cmd: "doctor",
    args: "None",
    desc: "Checks whether the local Android environment is ready.",
  },
  {
    cmd: "serve",
    args: "[projectDir], --port, --watch",
    desc: "Starts a local preview server for supported project types.",
  },
  {
    cmd: "keystore create",
    args: "--path, --alias, --store-password, --key-password",
    desc: "Creates a release keystore and signing scaffold.",
  },
  {
    cmd: "test",
    args: "[projectDir]",
    desc: "Validates generated project structure and template output.",
  },
  {
    cmd: "analyze",
    args: "<file.apk>",
    desc: "Inspects an APK and reports useful package details.",
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const NEWS_API_URL = "https://japkgen.opendnf.cloud/api/news.php?limit=6";

function DonateBox() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">

        {/* Top Glow */}
        <div className="h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-red-500" />

        {/* Content */}
        <div className="p-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 border border-orange-500/20">
              <HeartHandshake className="h-10 w-10 text-orange-400" />
            </div>
          </div>

          {/* Title */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-black tracking-tight">
              Support Me on Patreon
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Help support my open-source projects, experiments,
              and late-night coding chaos ☕
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              🚀 Early access to projects
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              💻 Behind-the-scenes development
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              ❤️ Support future updates
            </div>
          </div>

          {/* Button */}
          <a
            href="https://patreon.com/Khairy47/membership?utm_medium=donate&utm_source=website&utm_campaign=creatorshare_creator&utm_content=copyLink"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-[1.02] hover:bg-orange-400 active:scale-[0.98]"
          >
            Become a Patron
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </a>

          {/* Footer */}
          <p className="mt-5 text-center text-xs text-zinc-500">
            Even a small donation means a lot ✨
          </p>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  const [copied, setCopied] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: "ease-out-cubic",
    });
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      toast.success("Command copied to clipboard.", {
        description: text,
      });

      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error("Failed to copy the command.");
    }
  };

  const installCommand = "npm install -g japkgen";

  const loadNews = async () => {
    try {
      setNewsLoading(true);
      setNewsError("");

      const res = await fetch(NEWS_API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();
      setNews(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      console.error("Failed to load news:", err);
      setNewsError("Failed to load news feed.");
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const allowedRoutes = {
    home: "/",
    docs: "/docs/",
    github: "https://github.com/KhairyK/japkgen",
    npm: "https://npm.im/japkgen",
    donate: "https://patreon.com/c/Khairy47/membership?utm_medium=donate&utm_source=website&utm_campaign=creatorshare_creator&utm_content=copyLink"
  };

  function safeRedirect(key) {
    const target = allowedRoutes[key];

    if (!target) {
      console.error("Invalid redirect");
      return;
    }

    window.location.assign(target);
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 font-sans selection:bg-indigo-500/40 selection:text-white overflow-x-hidden">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "#0c111b",
            border: "1px solid #1e293b",
            color: "#e2e8f0",
          },
        }}
      />

      <div className="fixed inset-0 -z-20 pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_35%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.div
          className="absolute top-[-8rem] left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] rounded-full bg-indigo-500/10 blur-3xl"
          animate={{ y: [0, 18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10rem] right-[-8rem] w-[34rem] h-[34rem] rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <nav className="fixed top-0 w-full z-[100] bg-[#070b14]/75 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => scrollToSection("top")}
            className="flex items-center space-x-3 group"
            aria-label="Go to top"
          >
            <div className="bg-indigo-600 p-1.5 rounded-xl shadow-[0_0_25px_rgba(79,70,229,0.35)] group-hover:scale-105 transition-transform">
              <Terminal size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-mono">
              JAPKGen
            </span>
          </button>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-indigo-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("news")}
              className="hover:text-indigo-400 transition-colors"
            >
              News
            </button>
            <button
              onClick={() => scrollToSection("templates")}
              className="hover:text-indigo-400 transition-colors"
            >
              Templates
            </button>
            <button
              onClick={() => scrollToSection("commands")}
              className="hover:text-indigo-400 transition-colors"
            >
              Commands
            </button>
            <button
              onClick={() => scrollToSection("structure")}
              className="hover:text-indigo-400 transition-colors"
            >
              Structure
            </button>
            <button 
              onClick={() => safeRedirect('donate')}
              className="hover:text-indigo-400 transition-colors"
            >
              Donate
            </button>
          </div>

          <button
            className="hidden sm:flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm border border-slate-700/80 transition-all hover:-translate-y-0.5"
            onClick={() => copyToClipboard(installCommand)}
          >
            <GitBranch size={16} />
            <span>{copied ? "Copied" : "Copy Install Command"}</span>
          </button>
        </div>
      </nav>

      <section id="top" className="relative pt-36 pb-20 px-6 overflow-hidden">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          data-aos="zoom-in"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-indigo-300 text-xs font-mono mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>CLI-BASED ANDROID GENERATOR</span>
            <Sparkles size={12} className="text-cyan-300" />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-[1.06] text-white"
          >
            Build Android Projects
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300">
              Faster, Cleaner, and Smarter.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base md:text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            <span className="text-slate-200 font-semibold italic">japkgen</span>{" "}
            helps developers scaffold Android, WebView, Web APK, native, and
            frontend-integrated projects directly from the terminal with a clean
            beta workflow.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center space-y-4"
          >
            <div className="group relative flex items-center max-w-full bg-[#0c111b] border border-slate-700/80 rounded-2xl px-4 md:px-6 py-4 font-mono text-sm md:text-base shadow-2xl shadow-black/20 transition-all hover:border-indigo-500/50 hover:shadow-indigo-500/10">
              <span className="text-indigo-400 mr-3">$</span>
              <span className="text-slate-200 break-all">{installCommand}</span>
              <button
                onClick={() => copyToClipboard(installCommand)}
                className="ml-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Copy install command"
              >
                {copied ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <Copy
                    size={16}
                    className="text-slate-500 group-hover:text-indigo-400"
                  />
                )}
              </button>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-indigo-500" /> Fast
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-indigo-500" /> Reliable
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-indigo-500" /> Open
                Source
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-10 border-y border-slate-800/80 bg-slate-950/40">
        <motion.div
          className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-6 md:gap-8 opacity-70 grayscale hover:grayscale-0 transition-all"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 0.7, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img
            src="https://img.shields.io/badge/Node.js-LTS_Only-339933?style=for-the-badge&logo=node.js&logoColor=white"
            alt="Node"
          />
          <img
            src="https://img.shields.io/badge/License-Apache--2.0-blue.svg?style=for-the-badge"
            alt="License"
          />
          <img
            src="https://img.shields.io/badge/Android-SDK%2034-3DDC84?style=for-the-badge&logo=android&logoColor=white"
            alt="Android"
          />
          <img
            src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=java&logoColor=white"
            alt="Java"
          />
        </motion.div>
      </section>

      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Capabilities
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to start Android and hybrid project scaffolding
            with clarity and without unnecessary overhead.
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              data-aos="fade-up"
              data-aos-delay={index * 60}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="group p-8 rounded-3xl bg-[#0c111b]/90 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-300 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/15 transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="news" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-cyan-300 text-[11px] font-mono mb-4"
              data-aos="fade-up"
            >
              <Newspaper size={12} />
              LIVE API FEED
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Latest Updates
            </h2>
            <p className="text-slate-400 max-w-2xl">
              Release notes, fixes, and project updates shown in one place so
              visitors can follow what is changing without digging through the
              repository first.
            </p>
          </div>

          <button
            onClick={loadNews}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700 transition-all text-sm text-slate-200"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {newsLoading ? (
          <div className="p-8 rounded-3xl bg-[#0c111b] border border-slate-800 text-slate-400">
            Loading news feed...
          </div>
        ) : newsError ? (
          <div className="p-8 rounded-3xl bg-[#0c111b] border border-red-500/30 text-red-300">
            {newsError}
          </div>
        ) : news.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0c111b] border border-slate-800 text-slate-400">
            No news yet.
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {news.map((item, index) => (
              <motion.article
                key={item.id ?? index}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group p-6 rounded-3xl bg-[#0c111b]/90 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.featured ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-full">
                        Featured
                      </span>
                    ) : null}
                    {item.category ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {item.date || ""}
                  </span>
                </div>

                <h3 className="text-white font-bold text-lg mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {item.desc}
                </p>

                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    Read more <ArrowRight size={14} />
                  </a>
                ) : null}
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>

      <section
        id="templates"
        className="py-24 bg-slate-950/40 border-y border-slate-800/60"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Templates
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              JAPKGEN ships with Android, native, web, and frontend templates so
              you can start from the right foundation instead of assembling
              everything by hand.
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {templates.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="p-6 rounded-3xl bg-[#0c111b]/90 border border-slate-800/80 hover:border-indigo-500/40 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                  {item.name}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="commands" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl font-bold text-white mb-4 italic tracking-tighter">
            / COMMAND_REFERENCE
          </h2>
          <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full" />
        </div>

        <motion.div
          className="space-y-4"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {commands.map((c, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-950/50 border border-slate-800 rounded-2xl hover:bg-slate-900/70 hover:border-slate-700 transition-all"
            >
              <div>
                <span className="inline-flex items-center bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-lg text-sm font-mono font-bold mr-4 italic">
                  japkgen {c.cmd}
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  {c.args}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="structure" className="py-24 px-6 bg-[#060910]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="bg-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <FileCode className="text-indigo-400" /> Standardized Structure
            </h3>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="font-mono text-sm leading-relaxed text-indigo-300">
                <p>app/</p>
                <p className="pl-4 border-l border-slate-700">
                  ├── build.gradle
                </p>
                <p className="pl-4 border-l border-slate-700">
                  ├── <span className="text-slate-500">src/main/</span>
                </p>
                <p className="pl-8 border-l border-slate-700">
                  ├── AndroidManifest.xml
                </p>
                <p className="pl-8 border-l border-slate-700">
                  ├── <span className="text-emerald-400">java/</span>
                </p>
                <p className="pl-8 border-l border-slate-700">
                  ├── <span className="text-cyan-400">kotlin/</span>
                </p>
                <p className="pl-8 border-l border-slate-700">
                  ├── <span className="text-amber-400">cpp/</span>
                </p>
                <p className="pl-8 border-l border-slate-700">
                  └── <span className="text-amber-400">res/</span>
                </p>
                <p className="pl-4 border-l border-slate-700">├── gradlew</p>
                <p className="pl-4 border-l border-slate-700">
                  └── settings.gradle
                </p>
              </div>

              <div className="text-slate-400 text-sm flex flex-col justify-center">
                <p className="mb-4 italic leading-relaxed">
                  “japkgen keeps the generated structure predictable so projects
                  can be opened, inspected, and extended without extra cleanup.”
                </p>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-[12px] space-y-2">
                  <p className="flex justify-between gap-6">
                    <span>Minimum Node:</span>{" "}
                    <span className="text-white">v18.0.0</span>
                  </p>
                  <p className="flex justify-between gap-6">
                    <span>Java Version:</span>{" "}
                    <span className="text-white">JDK 17</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 px-6 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-indigo-600/5 -skew-y-6 scale-110" />
        <motion.div
          className="relative max-w-4xl mx-auto"
          data-aos="zoom-in"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Build Your First APK?
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Install JAPKGEN, pick a template, and start generating project
            scaffolds without the usual setup drag.
          </p>

          <DonateBox />

          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => copyToClipboard(installCommand)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              {copied ? "Copied to Clipboard" : "Install japkgen"}
            </motion.button>

            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => safeRedirect("docs")}
              className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold border border-slate-700 transition-all flex items-center gap-2"
            >
              Documentation <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>
      </section>

      <footer className="py-12 border-t border-slate-800 text-center px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
              <Terminal size={16} className="text-indigo-400" />
            </div>
            <span className="font-bold text-white tracking-widest font-mono">
              JAPKGen
            </span>
          </div>

          <div className="text-sm text-slate-500">
            © 2026 Apache License 2.0. OpenDN Foundation
          </div>

          <div className="flex space-x-4">
            <GitBranch
              size={20}
              className="text-slate-500 hover:text-white cursor-pointer transition-colors"
            />
            <Command
              size={20}
              className="text-slate-500 hover:text-white cursor-pointer transition-colors"
            />
            <ArrowRight
              size={20}
              className="text-slate-500 hover:text-white cursor-pointer transition-colors"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
