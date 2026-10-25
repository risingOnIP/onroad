"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileSignature,
  Clock,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  FileText,
  Sparkles,
  Building2,
  ChevronDown,
  Brain,
  Database,
  UserCheck,
  ClipboardList,
  Shield,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [currentOraMessage, setCurrentOraMessage] = useState(0);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const backgroundX = useTransform(mouseX, [0, 1000], [0, 100]);
  const backgroundY = useTransform(mouseY, [0, 1000], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 1000;
    const y = (e.clientY - rect.top) / rect.height * 1000;
    mouseX.set(x);
    mouseY.set(y);
  };

  const oraMessages = [
    {
      icon: FileText,
      category: "Deal Setup",
      message: "I created your Selling deal for 456 Oakwood Dr. The property address is already in the deal name, I've attached the One to Four Family Residential Contract, and I pre-filled the seller's info from your client intake."
    },
    {
      icon: ClipboardList,
      category: "Intake → Forms",
      message: "I pulled your buyer's intake responses, filled in the Third Party Financing Addendum, calculated loan amounts, and generated the correct Property Insurance requirements for review."
    },
    {
      icon: ShieldCheck,
      category: "Compliance",
      message: "Before you send this contract, I've flagged that the Seller's Disclosure Notice is incomplete. I've added your brokerage's defaults and highlighted what's still required per state regulations."
    },
    {
      icon: Sparkles,
      category: "Smart Guidance",
      message: "This is a New Construction deal. I've added the New Home Contract (Incomplete Construction) and Addendum for Property Subject to Mandatory Membership, pre-filled the builder details, and marked all required disclosures."
    },
    {
      icon: Zap,
      category: "Cross-Form Sync",
      message: "I noticed you updated the buyer's name in the Unimproved Property Contract. I've synced that change across all linked forms including the Environmental Assessment addendum, so everything stays consistent."
    }
  ];

  // Smooth chunk-by-chunk fade-in animation
  useEffect(() => {
    if (!oraMessages[currentOraMessage]) return;
    const message = oraMessages[currentOraMessage].message;
    const words = message.split(' ');
    const chunkSize = 3; // Display 3 words at a time
    const chunks: string[][] = [];
    
    // Create chunks of words
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, Math.min(i + chunkSize, words.length)));
    }
    
    setDisplayedWords([]);
    setIsTyping(true);
    
    let currentChunkIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentChunkIndex < chunks.length && chunks[currentChunkIndex]) {
        const currentChunk = chunks[currentChunkIndex];
        if (Array.isArray(currentChunk)) {
          setDisplayedWords(prev => [...prev, ...currentChunk]);
        }
        currentChunkIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 250); // Show each chunk every 250ms for smoother, slower reading

    return () => clearInterval(typingInterval);
  }, [currentOraMessage]);

  // Auto-rotate messages - wait for progress bar to complete
  useEffect(() => {
    const rotateTimeout = setTimeout(() => {
      setCurrentOraMessage((prev) => (prev + 1) % oraMessages.length);
    }, 10000); // Match the 10 second progress bar duration
    
    return () => clearTimeout(rotateTimeout);
  }, [currentOraMessage]);

  const toggleService = (service: string) => {
    setExpandedService(expandedService === service ? null : service);
  };

  const services = [
    {
      id: "intelliforms",
      title: "IntelliForms",
      icon: FileSignature,
      brief: "AI-powered form automation",
      details:
        "Our intelligent form system uses AI to understand deal context and automatically populate all required fields. Support for over 200 standard real estate forms with custom template creation.",
      features: [
        "Natural language input",
        "Auto-validation and error checking",
        "Multi-form synchronization",
        "Compliance verification",
      ],
    },
    {
      id: "clientonboarding",
      title: "Client Onboarding",
      icon: UserCheck,
      brief: "Streamlined intake process",
      details:
        "Transform fragmented client communication into a single, organized workflow. Collect all necessary information once and use it throughout the entire transaction.",
      features: [
        "Mobile-responsive forms",
        "Progressive data collection",
        "Automatic CRM updates",
        "Document request automation",
      ],
    },
    {
      id: "clientsync",
      title: "ClientSync CRM",
      icon: Database,
      brief: "Real estate-focused CRM",
      details:
        "Purpose-built for real estate professionals. Track leads, manage active deals, and maintain client relationships with automated follow-ups and intelligent insights.",
      features: [
        "Pipeline visualization",
        "Automated task creation",
        "Email and SMS integration",
        "Performance analytics",
      ],
    },
    {
      id: "brokerhub",
      title: "Broker Hub",
      icon: Building2,
      brief: "Team management platform",
      details:
        "Centralized control for brokerages. Create standardized workflows, manage compliance, and empower your team with pre-approved resources.",
      features: [
        "Template library management",
        "Team performance tracking",
        "Compliance monitoring",
        "Training resources",
      ],
    },
    {
      id: "esignatures",
      title: "Built-In E-Signatures",
      icon: Shield,
      brief: "Secure electronic signatures",
      details:
        "No need for separate e-signature subscriptions. OnRoad includes legally-binding electronic signatures with full audit trails, bank-level encryption, and instant notifications when documents are signed.",
      features: [
        "ESIGN Act & UETA compliant",
        "256-bit encryption",
        "Real-time status tracking",
        "Mobile signing support",
      ],
    },
    {
      id: "pdfeditor",
      title: "Built-In PDF Editor",
      icon: Edit,
      brief: "Professional PDF editing tools",
      details:
        "Edit, annotate, and prepare PDFs directly within OnRoad. No need for expensive PDF software. Add signature fields, text boxes, checkboxes, and more with our intuitive drag-and-drop editor. Perfect for customizing forms and preparing documents for signature.",
      features: [
        "Drag-and-drop form fields",
        "Text and annotation tools",
        "Signature field placement",
        "Auto-save functionality",
      ],
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50"
        onMouseMove={handleMouseMove}
      >
        {/* Stunning multi-layer background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 via-transparent to-gray-500/3" />
          
          {/* Mesh gradient overlay */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(at 20% 30%, hsla(142, 71%, 45%, 0.2) 0px, transparent 50%),
                               radial-gradient(at 70% 20%, hsla(45, 93%, 58%, 0.15) 0px, transparent 50%),
                               radial-gradient(at 10% 70%, hsla(160, 84%, 39%, 0.15) 0px, transparent 50%),
                               radial-gradient(at 90% 60%, hsla(35, 100%, 55%, 0.1) 0px, transparent 50%),
                               radial-gradient(at 30% 90%, hsla(152, 69%, 40%, 0.15) 0px, transparent 50%),
                               radial-gradient(at 80% 90%, hsla(43, 96%, 56%, 0.1) 0px, transparent 50%)`
            }}
          />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(to right, #10b98120 1px, transparent 1px),
                               linear-gradient(to bottom, #10b98120 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Mouse-following gradient */}
        <motion.div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundPositionX: backgroundX,
            backgroundPositionY: backgroundY,
            backgroundImage: 'radial-gradient(800px circle at center, rgba(16, 185, 129, 0.2), transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />

        {/* Animated orbs - better distributed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
          className="absolute -z-10 top-[10%] left-[5%] w-80 h-80 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full filter blur-3xl animate-blob"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.7 }}
          className="absolute -z-10 bottom-[20%] right-[10%] w-96 h-96 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full filter blur-3xl animate-blob animation-delay-2000"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.9 }}
          className="absolute -z-10 top-[60%] left-[70%] w-72 h-72 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full filter blur-3xl animate-blob animation-delay-4000"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 1.1 }}
          className="absolute -z-10 top-[40%] right-[60%] w-64 h-64 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full filter blur-3xl animate-blob animation-delay-2000"
        />
        
        <div className="relative z-10 container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span className="text-5xl font-bold bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                OnRoad
              </span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-emerald-500"
              >
                <Zap className="w-8 h-8" />
              </motion.div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="block text-gray-800">
                Put your contracts on
              </span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent animate-gradient-x">
                cruise control
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              Meet Ora, Your AI Agent for Real Estate. Stop drowning in paperwork 
              and instead turn hours of tedious work into minutes of guided review, 
              letting you focus more on clients and closing deals.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex justify-center"
            >
              <Link href="/contact">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 group shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Floating feature badges */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Sparkles, text: "AI-Powered" },
                { icon: Clock, text: "Hours Faster" },
                { icon: Shield, text: "Bank-Level Security" },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <badge.icon className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </motion.section>

      {/* Ora AI Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/20 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-100 to-emerald-50 px-6 py-3 rounded-full mb-8 shadow-md"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Brain className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <span className="text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Introducing Ora
              </span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-800">
              Your AI Agent for
              <span className="block mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent animate-gradient-x">
                Intelligent Real Estate
              </span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Ora understands context, learns from your patterns, and proactively suggests 
              the next best action. Like having a seasoned expert by your side, 24/7.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Natural Language Processing",
                description: "Just describe what you need in plain English. Ora understands real estate terminology and context.",
                icon: Sparkles,
                color: "from-emerald-400 to-teal-400",
                delay: 0,
              },
              {
                title: "Predictive Intelligence",
                description: "Ora learns from your transactions to get smarter over time and automatically do what you need.",
                icon: Brain,
                color: "from-gray-400 to-emerald-400",
                delay: 0.1,
              },
              {
                title: "Automated Workflows",
                description: "Set it and forget it. Ora handles repetitive tasks while you focus on relationships.",
                icon: Zap,
                color: "from-gray-400 to-gray-300",
                delay: 0.2,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': feature.color.split(' ')[1],
                    '--tw-gradient-to': feature.color.split(' ')[3],
                  } as any}
                />
                <div className="relative bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <motion.div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-2.5 mb-4`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="w-full h-full text-white" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Animated AI visualization */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 relative"
          >
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          "0 0 0 0 rgba(16, 185, 129, 0)",
                          "0 0 0 10px rgba(16, 185, 129, 0.1)",
                          "0 0 0 20px rgba(16, 185, 129, 0)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-emerald-500 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-600">Ora is thinking...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = oraMessages[currentOraMessage].icon;
                      return Icon ? <Icon className="w-4 h-4 text-emerald-500" /> : null;
                    })()}
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {oraMessages[currentOraMessage].category}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-1 bg-gray-200 rounded-full mb-6 overflow-hidden">
                  <motion.div
                    key={currentOraMessage}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 10, ease: "linear" }} 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  />
                </div>
                
                {/* Message content with smooth fade-in animation */}
                <div className="min-h-[100px]">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {displayedWords.map((word, index) => (
                      <motion.span
                        key={`${currentOraMessage}-${index}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.6,
                          delay: index * 0.08, // Overlapping fade-ins
                          ease: "easeOut"
                        }}
                        className="inline-block"
                        style={{ marginRight: "0.25rem" }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </p>
                </div>
                
                {/* Message indicators */}
                <div className="flex justify-center gap-1.5 mt-6">
                  {oraMessages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOraMessage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentOraMessage
                          ? "bg-emerald-500 w-8"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-emerald-400/10 rounded-full"
              initial={{ 
                x: (i * 167) % 1000, // Deterministic spacing
                y: 600
              }}
              animate={{ 
                y: -20,
                x: ((i * 167) + 100) % 1000 // Deterministic end position
              }}
              transition={{ 
                duration: 15 + i * 2, // Deterministic duration based on index
                repeat: Infinity,
                delay: i * 0.8, // Deterministic delay
                ease: "linear"
              }}
            />
          ))}
        </div>
      </section>

      {/* Platform Overview Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              A Unified Platform for Peak Performance
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From first contact to final signature, OnRoad provides an all-in-one toolkit 
              designed for speed and efficiency. Use our integrated platform to manage your 
              entire deal pipeline, automate tedious tasks, and give your clients a 
              world-class experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Sections */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* IntelliForms Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <FileSignature className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">IntelliForms</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                Fill out contracts in minutes, not hours.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Eliminate manual data entry and costly errors. Our intuitive UI makes complex 
                real estate forms simple. Breeze through purchase agreements, listings, and 
                disclosures with AI Assist: just provide the deal details in plain English 
                and watch the forms populate instantly and accurately.
              </p>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
            >
              <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                <Zap className="w-24 h-24 text-emerald-500" />
              </div>
            </motion.div>
          </motion.div>

          {/* E-Signature Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
              >
                <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                  <Shield className="w-24 h-24 text-emerald-500" />
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">Built-In E-Signatures</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                Close deals from anywhere, instantly.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                No more switching between platforms or paying for separate e-signature services. 
                OnRoad includes secure, legally-binding electronic signatures built right in. 
                Send documents for signing with one click, track signature status in real-time, 
                and get instant notifications when documents are completed. Full audit trails 
                and bank-level encryption ensure every signature is secure and compliant.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>ESIGN Act Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>UETA Compliant</span>
                </div>
              </div>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Client Onboarding Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <UserCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">Smart Client Intake</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                The end of manual data entry.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Stop chasing clients for details over messy emails and phone calls. 
                Send one straightforward form, and your clients can fill out their 
                information on any device. That data then becomes the single source 
                of truth for the entire transaction, populating every contract instantly 
                and accurately. No typos, no mistakes, and no wasted time.
              </p>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
            >
              <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                <UserCheck className="w-24 h-24 text-emerald-500" />
              </div>
            </motion.div>
          </motion.div>

          {/* ClientSync CRM Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
              >
                <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                  <Database className="w-24 h-24 text-emerald-500" />
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Database className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">ClientSync CRM</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                Never lose track of a lead or a deal.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                A CRM built for the pace of real estate. Track clients, properties, 
                key dates, and communications all in one place. Get a bird's-eye view 
                of your entire pipeline, from prospective buyers to closed deals, and 
                automate your follow-ups to stay on top of things.
              </p>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Broker Hub Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Briefcase className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">Enterprise Broker Hub</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                Empower your team with standardized workflows.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Brokers can create, manage, and distribute pre-approved form packages 
                and clause libraries to their entire team. Ensure compliance, maintain 
                brand consistency, and reduce agent onboarding time by providing a 
                single source of truth for all paperwork.
              </p>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
            >
              <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                <Briefcase className="w-24 h-24 text-emerald-500" />
              </div>
            </motion.div>
          </motion.div>

          {/* PDF Editor Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center mb-32"
          >
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-2xl p-8 shadow-lg"
              >
                <div className="aspect-video bg-white dark:bg-gray-900 rounded-lg shadow-inner flex items-center justify-center">
                  <Edit className="w-24 h-24 text-emerald-500" />
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Edit className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">Built-In PDF Editor</h3>
              </div>
              <p className="text-2xl font-semibold mb-4 text-muted-foreground">
                Edit and prepare documents without leaving OnRoad.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Stop switching between multiple apps and expensive PDF software. OnRoad's 
                built-in PDF editor lets you add form fields, text boxes, signature blocks, 
                and annotations directly to any document. Drag and drop to position elements 
                precisely where you need them. Auto-save ensures you never lose your work. 
                Perfect for customizing forms, preparing documents for signature, and making last-minute edits.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Drag & Drop Fields</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Text Annotations</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Auto-Save</span>
                </div>
              </div>
              <Link href="/contact">
                <Button className="group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Expandable Services Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Click on any service to learn more about how OnRoad transforms your workflow
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                  onClick={() => toggleService(service.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <service.icon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{service.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.brief}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedService === service.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {expandedService === service.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t">
                            <p className="text-muted-foreground mb-4">
                              {service.details}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {service.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  <span className="text-sm">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-24 bg-gradient-to-br from-emerald-500 to-teal-500 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-teal-500/30 to-emerald-600/30" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Put Your Contracts on Cruise Control?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Discover how OnRoad's intelligent automation can help you close deals 
            faster and streamline your real estate transactions
          </p>
          <div className="flex justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
    </>
  );
}