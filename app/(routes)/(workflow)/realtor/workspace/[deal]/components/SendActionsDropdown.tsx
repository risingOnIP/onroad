"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  ChevronDown,
  PenTool,
  FileCheck,
} from "lucide-react";

interface SendActionsDropdownProps {
  onSendSignatures: () => void;
  onSendForReview?: () => void;
  showReviewOption?: boolean;
  isReviewDisabled?: boolean;
  className?: string;
}

const SendActionsDropdown: React.FC<SendActionsDropdownProps> = ({
  onSendSignatures,
  onSendForReview,
  showReviewOption = false,
  isReviewDisabled = false,
  className = "",
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sendButtonAnimating, setSendButtonAnimating] = useState(false);

  const handleSendAction = (action: 'signatures' | 'review') => {
    // Trigger animation
    setSendButtonAnimating(true);
    setTimeout(() => setSendButtonAnimating(false), 600);
    
    // Close dropdown
    setDropdownOpen(false);
    
    // Perform action
    if (action === 'signatures') {
      onSendSignatures();
    } else if (action === 'review' && onSendForReview) {
      onSendForReview();
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`
              relative overflow-hidden flex items-center gap-2 px-4 text-sm h-9 
              border-gradient-to-r from-blue-600 to-purple-600 
              bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100
              text-blue-700 font-medium shadow-lg shadow-blue-500/20
              transition-all duration-300 transform
              ${sendButtonAnimating ? 'scale-95' : 'hover:scale-105'}
              ${dropdownOpen ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              ${className}
            `}
            style={{
              background: sendButtonAnimating 
                ? 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)' 
                : undefined,
              backgroundSize: sendButtonAnimating ? '200% 100%' : undefined,
              animation: sendButtonAnimating ? 'shimmer 0.6s ease-out' : undefined,
            }}
          >
            <Send className={`h-4 w-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-45' : ''}`} />
            <span className={`transition-colors duration-300 ${sendButtonAnimating ? 'text-white' : ''}`}>
              Send
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            
            {/* Ripple effect on animation */}
            {sendButtonAnimating && (
              <span className="absolute inset-0 rounded-md animate-ping bg-blue-400 opacity-20" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          <DropdownMenuItem
            onClick={() => handleSendAction('signatures')}
            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <PenTool className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Send for Signatures</span>
              <span className="text-xs text-muted-foreground">Collect signatures on this form</span>
            </div>
          </DropdownMenuItem>
          
          {/* Only show review option when enabled */}
          {showReviewOption && onSendForReview && (
            <DropdownMenuItem
              onClick={() => handleSendAction('review')}
              className="flex items-center gap-3 py-3 cursor-pointer hover:bg-amber-50 focus:bg-amber-50 transition-colors"
              disabled={isReviewDisabled}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                <FileCheck className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">Send for Review</span>
                <span className="text-xs text-muted-foreground">Request broker approval</span>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default SendActionsDropdown;