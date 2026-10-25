"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CalendarIcon, Send, CheckCircle2, ChevronRight,
  Mail, Phone, Home, DollarSign,
  Brain, FileCheck, Loader2, FileX, Clock4, Edit3,
  Users, Eye, FileText, ArrowRight, Sparkles,
  PawPrint, Calendar as CalendarDays, MapPin, CreditCard
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLightningSchema } from '@/app/actions/realtor/lightning-actions';
import { Schema, SchemaItem } from '@/components/files/types/realtor';

interface LightningFormsViewProps {
  dealId: string;
  dealData: any;
}

interface TimelineStep {
  id: number;
  title: string;
  status: 'completed' | 'active' | 'upcoming';
  description: string;
  icon: React.ReactNode;
}


// Helper function to get appropriate icon based on field attributes
const getFieldIcon = (displayAttrs: any) => {
  if (displayAttrs.special_input?.text?.email) return <Mail className="w-3 h-3" />;
  if (displayAttrs.special_input?.text?.phone) return <Phone className="w-3 h-3" />;
  if (displayAttrs.special_input?.text?.date) return <CalendarIcon className="w-3 h-3" />;
  if (displayAttrs.special_input?.text?.currency) return <DollarSign className="w-3 h-3" />;
  if (displayAttrs.block?.toLowerCase().includes('property')) return <Home className="w-3 h-3" />;
  return undefined;
};

// Helper function to get input type from display attributes
const getInputType = (displayAttrs: any): string => {
  if (displayAttrs.special_input?.text?.email) return 'email';
  if (displayAttrs.special_input?.text?.phone) return 'tel';
  if (displayAttrs.special_input?.text?.date) return 'date';
  if (displayAttrs.special_input?.text?.number) return 'number';
  return 'text';
};

const LightningFormsView: React.FC<LightningFormsViewProps> = ({ dealId }) => {
  const [currentStep, setCurrentStep] = useState(2);
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [schemaItems, setSchemaItems] = useState<Schema>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiActionText, setAiActionText] = useState('Filling in lease details...');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load lightning schema on component mount
  useEffect(() => {
    const loadLightningSchema = async () => {
      try {
        setIsLoadingSchema(true);
        const schema : Schema = await getLightningSchema('lease', 'residential');
        
        setSchemaItems(schema);
        
        // Set the first block as active tab
        if (schema.length > 0) {
          const firstBlock = schema[0].display_attributes.block || 'General';
          setActiveTab(firstBlock);
        }
      } catch (error) {
        console.error('Failed to load lightning schema:', error);
        setSchemaItems([]);
      } finally {
        setIsLoadingSchema(false);
      }
    };
    
    loadLightningSchema();
  }, [dealId]);

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate line height (approximately 1.5rem or 24px)
    const lineHeight = 24;
    const maxLines = 4;
    const maxHeight = lineHeight * maxLines;
    
    // Set height based on content, with max of 4 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    
    // Show/hide scrollbar based on content
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  // Adjust height when input message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const timelineSteps: TimelineStep[] = [
    { 
      id: 1, 
      title: 'Intakes', 
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : 'upcoming',
      description: 'AI generates personalized intake forms',
      icon: <Mail className="w-4 h-4" />
    },
    { 
      id: 2, 
      title: 'Essentials', 
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : 'upcoming',
      description: 'Provide key details for forms',
      icon: <Edit3 className="w-4 h-4" />
    },
    { 
      id: 3, 
      title: 'Review', 
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'active' : 'upcoming',
      description: 'Send to broker review and have AI perform compliance checks',
      icon: <FileCheck className="w-4 h-4" />
    },
    { 
      id: 4, 
      title: 'Signatures', 
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'active' : 'upcoming',
      description: 'Manage signature workflows',
      icon: <Edit3 className="w-4 h-4" />
    },
  ];

  const handleFieldChange = (fieldId: string, value: any) => {
    setSchemaItems(prev =>
      prev.map(item => {
        if (item.unique_id === fieldId) {
          return {
            ...item,
            display_attributes: {
              ...item.display_attributes,
              value: {
                ...item.display_attributes.value,
                output: value
              }
            }
          };
        }
        return item;
      })
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.toLowerCase();
    setInputMessage('');
    setIsTyping(true);

    // Generate dynamic AI action text based on input
    if (message.includes('rent')) {
      setAiActionText('Setting monthly rent amount...');
    } else if (message.includes('lease') && (message.includes('start') || message.includes('begin'))) {
      setAiActionText('Updating lease start date...');
    } else if (message.includes('tenant') || message.includes('resident')) {
      setAiActionText('Filling tenant information...');
    } else if (message.includes('deposit')) {
      setAiActionText('Setting security deposit details...');
    } else if (message.includes('date')) {
      setAiActionText('Updating lease dates...');
    } else if (message.includes('utility') || message.includes('utilities')) {
      setAiActionText('Configuring utility responsibilities...');
    } else {
      setAiActionText('Processing lease information...');
    }

    // Simulate AI processing and field updates
    setTimeout(() => {
      // Auto-update some fields based on keywords
      const monthlyRentField = schemaItems.find(item => item.unique_id === 'monthly_rent_amount');
      const leaseStartField = schemaItems.find(item => item.unique_id === 'lease_start_date');
      
      if ((message.includes('2500') || message.includes('rent')) && monthlyRentField) {
        handleFieldChange('monthly_rent_amount', '2500');
      }
      if ((message.includes('jan') || message.includes('january')) && leaseStartField) {
        handleFieldChange('lease_start_date', new Date('2025-01-01').toISOString());
      }
      
      setIsTyping(false);
    }, 2000);
  };

  const getFieldStatusIcon = (item: SchemaItem) => {
    const hasValue = item.display_attributes.value?.output;
    return hasValue 
      ? <CheckCircle2 className="w-3 h-3 text-green-600" />
      : <Clock4 className="w-3 h-3 text-gray-500" />;
  };

  const getFieldStatusColor = (item: SchemaItem) => {
    const hasValue = item.display_attributes.value?.output;
    return hasValue
      ? 'border-green-200 bg-green-50'
      : 'border-gray-200 bg-gray-50';
  };

  const groupedItems = schemaItems.reduce((acc, item) => {
    const block = item.display_attributes.block || 'General';
    if (!acc[block]) {
      acc[block] = [];
    }
    acc[block].push(item);
    return acc;
  }, {} as Record<string, Schema>);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Left Column - Essential Fields Card */}
              <div className="col-span-2 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Edit3 className="w-6 h-6 text-gray-700" />
                  <h3 className="text-xl font-semibold text-gray-900">Essential Details</h3>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                    AI handling background forms
                  </Badge>
                </div>
                
                {/* Chrome-style Tabbed Fields Card */}
                <Card className="h-[400px] flex flex-col overflow-hidden border shadow-sm">
                  {isLoadingSchema ? (
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Loading lightning schema...</p>
                      </div>
                    </CardContent>
                  ) : schemaItems.length === 0 ? (
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <FileX className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No fields available</p>
                        <p className="text-sm text-gray-500 mt-1">Lightning schema could not be loaded</p>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="pt-0 flex-1 flex flex-col overflow-hidden">
                      <div className="flex flex-col h-full">
                        {/* Chrome-style tabs */}
                        <div className="flex items-end border-b border-gray-200 mb-2">
                          {Object.keys(groupedItems).map((block, index) => (
                            <button
                              key={block}
                              onClick={() => setActiveTab(block)}
                              className={cn(
                                "px-4 py-2 text-sm font-medium transition-all relative",
                                "hover:bg-gray-50 rounded-t-lg",
                                activeTab === block
                                  ? "bg-white text-gray-900 border-l border-t border-r border-gray-200 -mb-px"
                                  : "text-gray-600 hover:text-gray-900"
                              )}
                              style={{
                                marginLeft: index > 0 ? '-1px' : '0',
                                zIndex: activeTab === block ? 10 : index
                              }}
                            >
                              {block}
                              {activeTab === block && (
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {/* Tab content with proper scrolling */}
                        <div className="flex-1 overflow-hidden">
                          <ScrollArea className="h-full pr-3">
                            {Object.entries(groupedItems).map(([block, items]) => (
                              activeTab === block && (
                                <div key={block} className="grid grid-cols-2 gap-3 pb-2">
                                  {items.map(item => (
                                    <motion.div
                                      key={item.unique_id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={cn(
                                        "p-3 rounded-lg border-2 transition-all relative",
                                        getFieldStatusColor(item)
                                      )}
                                    >
                                      <div className="flex items-start justify-between mb-1.5">
                                        <Label htmlFor={item.unique_id} className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                          {getFieldIcon(item.display_attributes)}
                                          {item.display_attributes.display_name || 'Field'}
                                        </Label>
                                        <div className="flex items-center gap-1">
                                          {getFieldStatusIcon(item)}
                                        </div>
                                      </div>
                                      {item.display_attributes.special_input?.text?.date ? (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={cn(
                                                "w-full justify-start text-left font-normal h-8",
                                                !item.display_attributes.value?.output && "text-muted-foreground"
                                              )}
                                            >
                                              <CalendarIcon className="mr-2 h-3 w-3" />
                                              {item.display_attributes.value?.output ? format(new Date(item.display_attributes.value.output as string), 'MMM dd, yyyy') : 'Select date'}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={item.display_attributes.value?.output ? new Date(item.display_attributes.value.output as string) : undefined}
                                              onSelect={(date) => handleFieldChange(item.unique_id, date?.toISOString() || '')}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      ) : item.display_attributes.input_type === 'radio' ? (
                                        <select
                                          id={item.unique_id}
                                          value={(item.display_attributes.value?.output as string) || ''}
                                          onChange={(e) => handleFieldChange(item.unique_id, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                          <option value="">Choose...</option>
                                          {item.display_attributes.display_radio_options?.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <Input
                                          id={item.unique_id}
                                          type={getInputType(item.display_attributes)}
                                          value={(item.display_attributes.value?.output as string) || ''}
                                          onChange={(e) => handleFieldChange(item.unique_id, e.target.value)}
                                          placeholder={item.display_attributes.placeholder}
                                          className="w-full h-8 text-sm"
                                        />
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              )
                            ))}
                          </ScrollArea>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Deal Summary Card */}
                <Card className="mt-4 flex-1 border shadow-sm">
                  <CardContent className="p-4 h-full overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Deal Summary</h3>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Auto-generated
                      </Badge>
                    </div>
                    
                    <div className="prose prose-sm text-gray-700 max-w-none">
                      <p className="text-sm leading-relaxed mb-3">
                        This is a <strong>12-month residential lease</strong> for the property located at <strong>123 Main Street, Austin, TX 78701</strong>. The property is a <strong>3-bedroom, 2-bathroom home</strong> with 1,850 square feet of living space.
                      </p>
                      
                      <p className="text-sm leading-relaxed mb-3">
                        The lease begins on <strong>January 1, 2025</strong> and ends on <strong>December 31, 2025</strong>. The monthly rent is set at <strong>$2,500</strong>, with a matching security deposit of <strong>$2,500</strong> required before move-in. The first month's rent and security deposit total <strong>$5,000</strong> due at signing.
                      </p>
                      
                      <p className="text-sm leading-relaxed mb-3">
                        The tenants for this property are <strong>John Doe</strong> (primary tenant) and <strong>Jane Smith</strong> (co-tenant). They will be responsible for all utility payments including electricity, gas, and internet services. The landlord will cover HVAC maintenance and major repairs.
                      </p>
                      
                      <p className="text-sm leading-relaxed mb-3">
                        Pets are allowed at the property with a maximum of <strong>2 animals</strong>. There is a <strong>$500 pet deposit</strong> and an additional <strong>$50 monthly pet fee</strong>. The property includes <strong>2 assigned parking spots</strong> (spaces #45 and #46).
                      </p>
                      
                      <p className="text-sm leading-relaxed">
                        Rent is due on the <strong>1st of each month</strong> via ACH transfer. A late fee of <strong>$100</strong> will be applied if payment is not received within 5 days of the due date. A move-in inspection is scheduled for <strong>December 28, 2024</strong> to document the property's condition before occupancy.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - AI Input & Action Card */}
              <div className="col-span-1 flex flex-col gap-4">
                {/* Emphasized AI Input Section */}
                <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-bold text-gray-900">AI Command</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Natural language
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Textarea
                          ref={textareaRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Tell AI what to fill..."
                          className="pr-10 border-2 border-blue-200 focus:border-blue-400 bg-white resize-none min-h-[2.25rem] w-full transition-all duration-200"
                          style={{ 
                            height: '2.25rem',
                            lineHeight: '1.5rem',
                            scrollbarWidth: 'thin'
                          }}
                          disabled={isTyping}
                          rows={1}
                        />
                        {inputMessage && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-2 top-3"
                          >
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                          </motion.div>
                        )}
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isTyping}
                        className="bg-blue-600 hover:bg-blue-700 shadow-md"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 italic">
                      Example: "John Doe tenant, $2500/month, starts January 1st, 12 month lease"
                    </p>
                  </CardContent>
                </Card>

                {/* AI Action Card */}
                <Card className="flex-1 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Timeline Steps */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 justify-center">
                        {timelineSteps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setCurrentStep(step.id)}
                                  className={cn(
                                    "flex items-center justify-center p-2 rounded-full transition-all",
                                    step.status === 'completed'
                                      ? "bg-green-100 text-green-700"
                                      : step.status === 'active'
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  )}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center",
                                    step.status === 'completed' ? "bg-green-600" : 
                                    step.status === 'active' ? "bg-white/20" : "bg-gray-400"
                                  )}>
                                    <div className="w-3.5 h-3.5 text-white">
                                      {step.icon}
                                    </div>
                                  </div>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{step.description}</p>
                              </TooltipContent>
                            </Tooltip>
                            {index < timelineSteps.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 flex flex-col justify-center">
                    {isTyping ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center"
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 360],
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="w-16 h-16 mx-auto mb-4"
                        >
                          <Brain className="w-16 h-16 text-blue-600" />
                        </motion.div>
                        <motion.h3 
                          className="text-xl font-bold text-gray-900 mb-2"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          AI is processing...
                        </motion.h3>
                        <motion.p 
                          className="text-gray-600"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {aiActionText}
                        </motion.p>
                        <motion.div className="flex justify-center gap-1 mt-4">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-blue-600 rounded-full"
                              animate={{ 
                                y: [0, -10, 0],
                                opacity: [0.3, 1, 0.3]
                              }}
                              transition={{ 
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-full flex flex-col justify-between"
                      >
                        {/* Stage-specific content */}
                        {currentStep === 1 && (
                          <>
                            <div className="text-center mb-4">
                              <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <Users className="w-7 h-7 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Client Intakes
                              </h3>
                              <p className="text-sm text-gray-600">
                                Send personalized intake forms to collect client information
                              </p>
                            </div>
                            <div className="space-y-2 flex-1">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs font-bold">JD</span>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium">John Doe</p>
                                      <p className="text-xs text-gray-500">Tenant</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Not sent
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button size="sm" className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send className="w-3 h-3 mr-1" />
                                    Send
                                  </Button>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs font-bold">JS</span>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-sm font-medium">Jane Smith</p>
                                      <p className="text-xs text-gray-500">Co-Tenant</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Not sent
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button size="sm" className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send className="w-3 h-3 mr-1" />
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {currentStep === 2 && (
                          <>
                            <div className="text-center mb-4">
                              <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <Edit3 className="w-7 h-7 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Essential Details
                              </h3>
                              <p className="text-sm text-gray-600">
                                Fill critical lease information while AI handles the rest
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Forms Auto-Generated</span>
                                  <span className="text-sm font-bold text-blue-600">12</span>
                                </div>
                              </div>
                
                
                
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Fields Completed</span>
                                  <span className="text-sm font-bold text-green-600">
                                    {schemaItems.filter(item => item.display_attributes.value?.output).length}/{schemaItems.length}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
                                <div className="flex flex-wrap gap-1">
                                  <Badge className="bg-blue-100 text-blue-700 text-xs cursor-pointer hover:bg-blue-200">
                                    Set rent $2500
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-700 text-xs cursor-pointer hover:bg-blue-200">
                                    Jan 1st start
                                  </Badge>
                                  <Badge className="bg-blue-100 text-blue-700 text-xs cursor-pointer hover:bg-blue-200">
                                    12 month lease
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {currentStep === 3 && (
                          <>
                            <div className="text-center mb-4">
                              <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <FileCheck className="w-7 h-7 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Broker Review
                              </h3>
                              <p className="text-sm text-gray-600">
                                Send to broker review and have AI perform compliance checks
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">State Compliance</span>
                                </div>
                                <p className="text-xs text-gray-600">All Texas requirements met</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">Required Addendums</span>
                                </div>
                                <p className="text-xs text-gray-600">Lead paint, pet policy included</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">Data Validation</span>
                                </div>
                                <p className="text-xs text-gray-600">All fields verified</p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {currentStep === 4 && (
                          <>
                            <div className="text-center mb-4">
                              <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <FileText className="w-7 h-7 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Signatures
                              </h3>
                              <p className="text-sm text-gray-600">
                                Manage signature workflows for all parties
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-600 mb-2">Signature Order:</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                                    <span className="text-xs">Tenant signs first</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">2</span>
                                    <span className="text-xs">Landlord reviews & signs</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">3</span>
                                    <span className="text-xs">Broker final approval</span>
                                  </div>
                                </div>
                              </div>
                              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="w-4 h-4 mr-2" />
                                Send for Signatures
                              </Button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LightningFormsView;