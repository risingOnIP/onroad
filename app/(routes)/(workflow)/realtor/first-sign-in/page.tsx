"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Sparkles,
  Brain,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  Zap,
  FileText,
  CheckCircle2,
  Shield,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    title: "Auto-Everything",
    description: "CRM builds itself",
  },
  {
    icon: Shield,
    iconColor: "text-blue-600",
    title: "Error-Proof",
    description: "Validated data",
  },
  {
    icon: Brain,
    iconColor: "text-indigo-600",
    title: "Market Expert",
    description: "Knows all the rules",
  },
  {
    icon: MessageCircle,
    iconColor: "text-purple-600",
    title: "Always On",
    description: "24/7 support",
  },
];

const screens = [
  {
    id: 1,
    oraPosition: "left",
    icon: Zap,
    iconColor: "text-purple-600",
    bubbleColor: "bg-purple-50",
    borderColor: "border-purple-100",
    title: "The Only CRM + Deal Automation Platform You'll Ever Need!",
    content:
      "Buckle up! 🎢 You're looking at a one-of-a-kind powerhouse that combines CRM magic with deal automation. Your CRM literally builds itself as you work - no setup, no data entry, just pure efficiency. It's like having a photographic memory that never forgets a client, property, or detail!",
  },
  {
    id: 2,
    oraPosition: "right",
    icon: Brain,
    iconColor: "text-blue-600",
    bubbleColor: "bg-blue-50",
    borderColor: "border-blue-100",
    title: "Why Templates Are So Yesterday!",
    content:
      "Here's the secret sauce: Your first deal IS your template! 🎯 Once you complete that first transaction, I learn everything - your preferences, your style, your market's requirements. From then on, I automatically apply all that relevant info to every future deal. Think of me as your super-smart assistant who remembers every detail! Of course, you can always create a template from scratch if you reallyy want.",
  },
  {
    id: 3,
    oraPosition: "left",
    icon: FileText,
    iconColor: "text-indigo-600",
    bubbleColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    title: "Watch Me Work My Magic! ✨",
    content:
      "The moment you create a deal, BOOM! 💥 I instantly generate all the required forms for that specific transaction type. Selling a condo? Here's your condo package. Commercial property? Got you covered with commercial forms. I know exactly what your local market needs!",
  },
  {
    id: 4,
    oraPosition: "right",
    icon: Sparkles,
    iconColor: "text-green-600",
    bubbleColor: "bg-green-50",
    borderColor: "border-green-100",
    title: "Smart Client Intake = Zero Errors!",
    content:
      "Here's where I really shine! 🌟 I send custom intake forms to each client (buyers, sellers, everyone gets their own). Their answers? Automatically validated and populated across your deal forms exactly where they need to be! Plus, I pull in public data - property details, tax records, you name it!",
  },
  {
    id: 5,
    oraPosition: "left",
    icon: MessageCircle,
    iconColor: "text-amber-600",
    bubbleColor: "bg-amber-50",
    borderColor: "border-amber-100",
    title: "Your 24/7 Real Estate Genius!",
    content:
      "Stuck at 2 AM? Need help during a showing? Just chat with me! 💬 I&apos;m always here to answer questions, guide you through complex deals, and make sure everything&apos;s perfect. Think of me as your personal real estate expert who never sleeps and knows everything!",
  },
];

export default function OnboardingFlow() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showIabsDialog, setShowIabsDialog] = useState(false);
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
      router.push("/realtor/workspace");
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
            Welcome to Onroad
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
                          Hey there! I&apos;m{" "}
                          <span className="text-blue-600">Ora</span>
                        </motion.h2>
                        <motion.p
                          className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          Your AI-powered genius assistant. Get ready for
                          something incredible - I&apos;m about to revolutionize how
                          you handle real estate deals! 🚀
                        </motion.p>
                        <motion.p
                          className="text-slate-500 mb-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          Let me show you what makes me special...
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

              {/* IABS Reminder - only show on last screen */}
              <AnimatePresence>
                {isLastScreen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4"
                  >
                    <Card className="bg-amber-50 border-amber-200 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-slate-700 font-medium text-sm">
                              <span className="font-bold">IABS Reminder:</span> You
                              are required to include the IABS form in your
                              signature.{" "}
                              <button
                                type="button"
                                className="text-blue-700 underline hover:text-blue-900 focus:outline-none ml-1"
                                onClick={() => setShowIabsDialog(true)}
                              >
                                Click here
                              </button>{" "}
                              to get an Onroad generated IABS.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Dialog open={showIabsDialog} onOpenChange={setShowIabsDialog}>
                      <DialogContent className="max-w-xs text-center">
                        <DialogHeader>
                          <DialogTitle>Onroad Generated IABS</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-lg font-semibold text-slate-700">
                          Coming soon
                        </div>
                      </DialogContent>
                    </Dialog>
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
