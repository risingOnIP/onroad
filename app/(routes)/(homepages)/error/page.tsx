"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearMessages } from "@/app/utils/chat-storage";
import { Trash2, CheckCircle } from "lucide-react";

const ErrorPage = () => {
  const [health, setHealth] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCleared, setIsCleared] = useState(false);

  const checkHealth = async (retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const healthCheck = await fetch(
          `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/health`
        );
        return healthCheck;
      } catch (err) {
        if (i === retries - 1) {
          setError("Failed to connect to server after multiple attempts");
          throw err;
        }
        // Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw new Error("Failed to connect to server");
  };

  const handleClearChatMessages = () => {
    try {
      clearMessages();
      setIsCleared(true);
      // Reset the success message after 3 seconds
      setTimeout(() => setIsCleared(false), 3000);
    } catch (error) {
      console.error("Failed to clear chat messages:", error);
    }
  };

  useEffect(() => {
    checkHealth()
      .then((result) => setHealth(result))
      .catch((err) => {
        console.error("Health check failed:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Page</h1>
          <p className="text-gray-600">System diagnostics and troubleshooting</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold text-gray-800 mb-2">API Status</h2>
            <p className="text-sm text-gray-600 mb-1">
              API URL: {process.env.NEXT_PUBLIC_EXPRESS_API_URL}
            </p>
            <p className="text-sm">
              Health Check: {error ? (
                <span className="text-red-600 font-medium">{error}</span>
              ) : health ? (
                <span className="text-green-600 font-medium">Healthy</span>
              ) : (
                <span className="text-yellow-600 font-medium">Checking...</span>
              )}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="font-semibold text-gray-800 mb-2">Troubleshooting</h2>
            <p className="text-sm text-gray-600 mb-3">
              If you&apos;re experiencing issues with the AI chat, try clearing the stored messages.
            </p>
            
            <Button
              onClick={handleClearChatMessages}
              variant={isCleared ? "default" : "outline"}
              className={`w-full ${isCleared ? "bg-green-600 hover:bg-green-700" : ""}`}
              disabled={isCleared}
            >
              {isCleared ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Chat Messages Cleared!
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear AI Chat Messages
                </>
              )}
            </Button>
            
            {isCleared && (
              <p className="text-xs text-green-600 mt-2 text-center">
                All AI chat messages have been removed from local storage.
              </p>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            className="text-sm"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
