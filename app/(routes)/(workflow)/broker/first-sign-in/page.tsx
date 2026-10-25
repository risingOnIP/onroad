"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  Shield,
  Loader2,
  BarChart,
  FileCheck,
  Building,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Users,
    iconColor: "text-blue-600",
    title: "Agent Management",
    description: "Oversee all agents",
  },
  {
    icon: FileCheck,
    iconColor: "text-green-600",
    title: "Deal Approval",
    description: "Review & approve",
  },
  {
    icon: BarChart,
    iconColor: "text-purple-600",
    title: "Analytics",
    description: "Track performance",
  },
  {
    icon: Shield,
    iconColor: "text-indigo-600",
    title: "Compliance",
    description: "Stay compliant",
  },
];

const screens = [
  {
    id: 1,
    oraPosition: "left",
    icon: Building,
    iconColor: "text-blue-600",
    bubbleColor: "bg-blue-50",
    borderColor: "border-blue-100",
    title: "Your Brokerage Command Center!",
    content:
      "Welcome to your executive dashboard! 🏢 As a broker, you're the captain of this ship. Manage multiple agents, oversee all transactions, and maintain complete visibility across your entire brokerage. Everything flows through you - approvals, compliance, and success metrics!",
  },
  {
    id: 2,
    oraPosition: "right",
    icon: Users,
    iconColor: "text-purple-600",
    bubbleColor: "bg-purple-50",
    borderColor: "border-purple-100",
    title: "Smart Agent Management System",
    content:
      "Your agents can request to tether with your brokerage instantly! 🤝 Once connected, you'll see all their deals, track their progress, and provide guidance when needed. Push templates to them, share resources, and ensure everyone follows your brokerage standards!",
  },
  {
    id: 3,
    oraPosition: "left",
    icon: FileCheck,
    iconColor: "text-green-600",
    bubbleColor: "bg-green-50",
    borderColor: "border-green-100",
    title: "Streamlined Deal Approval Process",
    content:
      "Every deal gets your stamp of approval! ✅ Review contracts before they go out, ensure compliance with local regulations, and maintain quality control. I'll flag anything that needs your attention and keep you informed of all critical milestones!",
  },
  {
    id: 4,
    oraPosition: "right",
    icon: BarChart,
    iconColor: "text-indigo-600",
    bubbleColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    title: "Real-Time Performance Analytics",
    content:
      "See your brokerage's pulse at a glance! 📊 Track agent performance, deal flow, commission projections, and success rates. I'll generate reports that help you identify top performers and areas for improvement. Data-driven decisions made easy!",
  },
  {
    id: 5,
    oraPosition: "left",
    icon: Shield,
    iconColor: "text-amber-600",
    bubbleColor: "bg-amber-50",
    borderColor: "border-amber-100",
    title: "Compliance & Risk Management",
    content:
      "Sleep soundly knowing everything's compliant! 🛡️ I monitor all transactions for regulatory compliance, ensure proper documentation, and maintain audit trails. Your brokerage's reputation is protected with automated checks and balances at every step!",
  },
];

export default function BrokerOnboardingFlow() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Auto-scroll to bottom when page loads
  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  const nextScreen = () => {
    if (showWelcome) {
      setShowWelcome(false);
      return;
    }
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    } else if (!showWelcome) {
      setShowWelcome(true);
    }
  };

  const isLastScreen = currentScreen === screens.length - 1 && !showWelcome;
  const isFirstScreen = currentScreen === 0 && showWelcome;

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push("/broker/workspace");
    }, 1000);
  };

  return (
    <div className="pt-8 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-20"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-16 pb-8 max-w-4xl min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Welcome to Your Brokerage Hub
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            {!showWelcome &&
              screens.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentScreen
                      ? "bg-blue-600 w-6"
                      : "bg-slate-300 w-2"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <Card className="bg-white shadow-xl border-slate-200 w-full">
                <CardContent className="p-8">
                  <AnimatePresence mode="wait">
                    {showWelcome ? (
                      <motion.div
                        key="welcome"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center"
                      >
                        <motion.div
                          className="mb-6"
                          animate={{
                            y: [0, -8, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <div className="w-32 h-32 mx-auto relative">
                            <Image
                              src="/Ora.png"
                              alt="Ora, the OnroadAI agent"
                              width={128}
                              height={128}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </motion.div>
                        <motion.h2
                          className="text-3xl font-bold text-slate-800 mb-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          Hey Broker! I&apos;m{" "}
                          <span className="text-blue-600">Ora</span>
                        </motion.h2>
                        <motion.p
                          className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          Your AI-powered brokerage assistant. I&apos;m here to help you
                          manage your agents, oversee deals, and grow your brokerage
                          efficiently! 🚀
                        </motion.p>
                        <motion.p
                          className="text-slate-500 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          Let me show you how I&apos;ll transform your brokerage operations...
                        </motion.p>

                        {/* Features Grid */}
                        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                          {features.map((feature, index) => (
                            <motion.div
                              key={index}
                              className="bg-slate-50 rounded-xl p-4 text-center"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.9 + index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {React.createElement(feature.icon, {
                                className: `w-8 h-8 ${feature.iconColor} mx-auto mb-2`,
                              })}
                              <h4 className="font-semibold text-slate-800 text-sm">
                                {feature.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1">
                                {feature.description}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`screen-${currentScreen}`}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-8 min-h-[320px]"
                      >
                        {screens[currentScreen].oraPosition === "left" ? (
                          <>
                            {/* Ora on left */}
                            <motion.div
                              className="flex-shrink-0"
                              animate={{
                                y: [0, -8, 0],
                                rotate: [0, 5, -5, 0],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <div className="w-28 h-28 relative">
                                <Image
                                  src="/Ora.png"
                                  alt="Ora, the OnroadAI agent"
                                  width={112}
                                  height={112}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </motion.div>

                            {/* Speech bubble on right */}
                            <motion.div
                              className={`${screens[currentScreen].bubbleColor} rounded-2xl p-6 flex-1 relative ${screens[currentScreen].borderColor} border shadow-md`}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div
                                className={`absolute -left-3 top-8 w-0 h-0 border-t-[12px] border-t-transparent border-r-[18px] ${screens[
                                  currentScreen
                                ].bubbleColor.replace(
                                  "bg-",
                                  "border-r-"
                                )} border-b-[12px] border-b-transparent`}
                              />
                              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-lg">
                                {React.createElement(
                                  screens[currentScreen].icon,
                                  {
                                    className: `w-6 h-6 ${screens[currentScreen].iconColor}`,
                                  }
                                )}
                                {screens[currentScreen].title}
                              </h3>
                              <p className="text-slate-600 leading-relaxed text-base">
                                {screens[currentScreen].content}
                              </p>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            {/* Speech bubble on left */}
                            <motion.div
                              className={`${screens[currentScreen].bubbleColor} rounded-2xl p-6 flex-1 relative ${screens[currentScreen].borderColor} border shadow-md`}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div
                                className={`absolute -right-3 top-8 w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] ${screens[
                                  currentScreen
                                ].bubbleColor.replace(
                                  "bg-",
                                  "border-l-"
                                )} border-b-[12px] border-b-transparent`}
                              />
                              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-lg">
                                {React.createElement(
                                  screens[currentScreen].icon,
                                  {
                                    className: `w-6 h-6 ${screens[currentScreen].iconColor}`,
                                  }
                                )}
                                {screens[currentScreen].title}
                              </h3>
                              <p className="text-slate-600 leading-relaxed text-base">
                                {screens[currentScreen].content}
                              </p>
                            </motion.div>

                            {/* Ora on right */}
                            <motion.div
                              className="flex-shrink-0"
                              animate={{
                                y: [0, -8, 0],
                                rotate: [0, -5, 5, 0],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <div className="w-28 h-28 relative">
                                <Image
                                  src="/Ora.png"
                                  alt="Ora, the OnroadAI agent"
                                  width={112}
                                  height={112}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </motion.div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Navigation */}
              <motion.div
                className="flex justify-between items-center mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  onClick={prevScreen}
                  disabled={isFirstScreen}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <div className="text-sm text-slate-500 font-medium">
                  {showWelcome
                    ? "Welcome"
                    : `${currentScreen + 1} of ${screens.length}`}
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={!isLastScreen ? nextScreen : handleGetStarted}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-6 py-3 ${
                      isLastScreen
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isLastScreen ? (
                      isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Broker License Reminder - only show on last screen */}
              <AnimatePresence>
                {isLastScreen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4"
                  >
                    <Card className="bg-blue-50 border-blue-200 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <UserCheck className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium text-sm">
                              <span className="font-bold">Broker Information:</span> Make
                              sure your broker license and contact information are up to
                              date in your profile settings. Your agents will need this
                              information to properly tether with your brokerage.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}