'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Mail,
  Calendar,
  Sparkles,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface RealtorReviewCardProps {
  realtor: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  formCounts: {
    reviewing: number;
    approved: number;
    not_sent: number;
    total: number;
  };
  lastActivityDate?: string;
  onClick: () => void;
  onRemove?: () => void;
}

export function RealtorReviewCard({ 
  realtor, 
  formCounts, 
  lastActivityDate,
  onClick,
  onRemove 
}: RealtorReviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasUrgentReviews = formCounts.reviewing > 0;
  const completionRate = formCounts.total > 0 
    ? Math.round((formCounts.approved / formCounts.total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "relative cursor-pointer transition-all duration-300 overflow-hidden",
          "hover:shadow-xl hover:border-primary/20",
          hasUrgentReviews && "border-orange-200 bg-gradient-to-br from-orange-50/50 to-transparent"
        )}
        onClick={onClick}
      >
        {/* Animated background gradient */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100"
          )}
          style={{
            background: isHovered 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%)'
              : 'none'
          }}
        />

        {/* Urgent indicator */}
        {hasUrgentReviews && (
          <div className="absolute top-0 right-0 w-24 h-24">
            <div className="absolute transform rotate-45 bg-orange-500 text-white text-xs font-bold py-1 right-[-35px] top-[18px] w-[120px] text-center shadow-sm">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                URGENT
              </div>
            </div>
          </div>
        )}

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            {/* Avatar and Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-gray-100">
                <AvatarImage src={realtor.avatar_url} alt={realtor.full_name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {getInitials(realtor.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                  {realtor.full_name}
                  {completionRate >= 80 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Top Performer
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {realtor.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onRemove && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      className="text-red-600 focus:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Realtor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <motion.div
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Pending Reviews */}
            <motion.div 
              className={cn(
                "bg-orange-50 rounded-lg p-3 border",
                formCounts.reviewing > 0 ? "border-orange-200" : "border-orange-100"
              )}
              animate={{ scale: isHovered && formCounts.reviewing > 0 ? 1.05 : 1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-2xl font-bold text-orange-900">
                  {formCounts.reviewing}
                </span>
              </div>
              <p className="text-xs text-orange-700 font-medium">Pending Review</p>
            </motion.div>

            {/* Approved */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-2xl font-bold text-green-900">
                  {formCounts.approved}
                </span>
              </div>
              <p className="text-xs text-green-700 font-medium">Approved</p>
            </div>

            {/* Need Revision */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <div className="flex items-center justify-between mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-2xl font-bold text-red-900">
                  {formCounts.not_sent}
                </span>
              </div>
              <p className="text-xs text-red-700 font-medium">Need Revision</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Completion Rate</span>
              <span className="font-bold text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div 
                className={cn(
                  "h-full rounded-full",
                  completionRate >= 80 ? "bg-gradient-to-r from-green-400 to-green-600" :
                  completionRate >= 50 ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                  "bg-gradient-to-r from-orange-400 to-orange-600"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              <span>{formCounts.total} total forms</span>
            </div>
            {lastActivityDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Last activity: {new Date(lastActivityDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Hover Indicator */}
          {isHovered && formCounts.reviewing > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 right-2"
            >
              <Badge className="bg-primary text-white shadow-lg">
                Click to review forms →
              </Badge>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}