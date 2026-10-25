'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileText, Home, Users, Zap, Edit3, FileSignature, Layout, HelpCircle, BookOpen, Layers, PenTool } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

function HelpDocsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("getting-started")

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['getting-started', 'deal-management', 'forms-and-templates', 'ai-features', 'pdf-editor'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Help & Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Welcome to OnRoad&apos;s comprehensive guide. We&apos;ve reimagined transaction management for real estate professionals, 
            making complex processes simple and efficient with AI-powered automation.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2 h-auto">
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="deal-management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Home className="w-4 h-4 mr-2" />
              Deal Management
            </TabsTrigger>
            <TabsTrigger value="forms-and-templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Forms & Templates
            </TabsTrigger>
            <TabsTrigger value="ai-features" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Zap className="w-4 h-4 mr-2" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="pdf-editor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Edit3 className="w-4 h-4 mr-2" />
              PDF Editor
            </TabsTrigger>
            </TabsList>
          </div>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Welcome to OnRoad
                </CardTitle>
                <CardDescription>
                  Your modern transaction management system designed for real estate professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">What Makes OnRoad Different?</h3>
                    <p className="text-muted-foreground">
                      Unlike traditional transaction management systems, OnRoad combines powerful CRM capabilities with 
                      intelligent form automation, making your workflow seamless from client intake to closing.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Automatic CRM Integration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Every client you represent automatically flows into your CRM when you create a deal, 
                          keeping your contacts organized without manual entry.
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          AI-Powered Automation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Our AI automatically fills forms and populates required fields, saving hours of repetitive work 
                          and reducing errors.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Quick Start Guide</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Create your first deal (Buy, Sell, Rent, or Lease)</li>
                      <li>Add client information - they&apos;ll automatically be saved to your CRM</li>
                      <li>Let AI auto-populate your forms based on deal information</li>
                      <li>Use templates to speed up common transactions</li>
                      <li>Send forms for signature with our integrated PDF editor</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deal Management Tab */}
          <TabsContent value="deal-management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Understanding Deal Types
                </CardTitle>
                <CardDescription>
                  Learn how different deal types work and their unique features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buy & Rent Deals */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Buy Deals</Badge>
                    <Badge variant="default">Rent Deals</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Multiple Properties Support</h4>
                    <p className="text-muted-foreground">
                      In Buy and Rent deals, you can add multiple properties because clients often bid on or explore 
                      several options before making a decision. This feature allows you to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Track multiple property searches in one deal</li>
                      <li>Organize forms by property for better clarity</li>
                      <li>Compare different options side-by-side</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Deal-Wide Forms</h4>
                    <p className="text-muted-foreground">
                      These are forms that apply across the entire deal, typically agreements between buyer and seller 
                      that aren&apos;t specific to any single property. Examples include:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Buyer representation agreements</li>
                      <li>Pre-approval documents</li>
                      <li>General disclosures</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Property Information Tab</h4>
                    <p className="text-muted-foreground">
                      Each property in Buy and Rent deals has a dedicated information tab where you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>Add seller contact information</li>
                      <li>Include seller agent details</li>
                      <li>Track property-specific documents</li>
                      <li>Manage offers and counteroffers</li>
                    </ul>
                  </div>
                </div>

                {/* Sell & Lease Deals */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Sell Deals</Badge>
                    <Badge variant="default">Lease Deals</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Single Property Focus</h4>
                    <p className="text-muted-foreground">
                      Sell and Lease deals are structured around a single property since you&apos;re representing 
                      the owner of one specific property. This streamlined approach means:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>All forms relate to one property</li>
                      <li>No property switching needed</li>
                      <li>Simplified document organization</li>
                      <li>Focused transaction management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forms & Templates Tab */}
          <TabsContent value="forms-and-templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Forms & Templates System
                </CardTitle>
                <CardDescription>
                  Streamline your workflow with intelligent forms and reusable templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Template Management
                  </h4>
                  <p className="text-muted-foreground">
                    Save time by creating and importing templates for common transactions:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Creating Templates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Build from existing successful deals</li>
                          <li>• Customize for different property types</li>
                          <li>• Include pre-filled common fields</li>
                          <li>• Share with team members</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Using Templates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Import with one click</li>
                          <li>• Auto-adapt to current deal</li>
                          <li>• Modify as needed</li>
                          <li>• Stack multiple templates</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Client Intake Templates
                  </h4>
                  <Badge variant="outline" className="mb-2">Time-Saving Feature</Badge>
                  <p className="text-muted-foreground">
                    One of our most powerful features - send customizable forms to clients and have their 
                    responses automatically populate your realtor forms:
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h5 className="font-medium">How It Works:</h5>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Create or select a client intake template</li>
                      <li>Send a secure link to your client</li>
                      <li>Client fills out the form at their convenience</li>
                      <li>Responses automatically flow into your transaction forms</li>
                      <li>Review and make any necessary adjustments</li>
                    </ol>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-3 mt-4">
                    <Card className="border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-primary">80%</div>
                          <p className="text-sm text-muted-foreground">Less data entry</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-primary">24/7</div>
                          <p className="text-sm text-muted-foreground">Client availability</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <div className="text-2xl font-bold text-primary">100%</div>
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Features Tab */}
          <TabsContent value="ai-features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI-Powered Automation
                </CardTitle>
                <CardDescription>
                  Let artificial intelligence handle the repetitive work so you can focus on your clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Intelligent Form Filling</h4>
                  <p className="text-muted-foreground">
                    Our AI analyzes your deal information and automatically fills as much of each form as possible:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">What AI Can Auto-Fill:</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✓ Client names and contact information</li>
                        <li>✓ Property addresses and details</li>
                        <li>✓ Deal dates and timelines</li>
                        <li>✓ Agent and brokerage information</li>
                        <li>✓ Common terms and conditions</li>
                        <li>✓ Calculated fields and totals</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">How It Learns:</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Analyzes patterns in your past deals</li>
                        <li>• Understands form field relationships</li>
                        <li>• Adapts to your preferences</li>
                        <li>• Improves accuracy over time</li>
                        <li>• Respects privacy and security</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-semibold">Required Forms Detection</h4>
                  <p className="text-muted-foreground">
                    Never miss a required form again. Our AI automatically identifies and suggests forms based on:
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mt-3">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">Deal Type</Badge>
                        <span className="text-muted-foreground">Buy, Sell, Rent, or Lease specific requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">Location</Badge>
                        <span className="text-muted-foreground">State and local compliance requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">Property Type</Badge>
                        <span className="text-muted-foreground">Residential, commercial, or special property forms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">Timeline</Badge>
                        <span className="text-muted-foreground">Stage-appropriate forms and disclosures</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PDF Editor Tab */}
          <TabsContent value="pdf-editor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Custom PDF Form Editor
                </CardTitle>
                <CardDescription>
                  Powerful editing tools for complete control over your documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Drag-and-Drop Editing</h4>
                  <p className="text-muted-foreground">
                    Our PDF editor gives you complete control over your forms with intuitive tools:
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Edit3 className="w-4 h-4" />
                          Text Editing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Add text anywhere</li>
                          <li>• Edit existing content</li>
                          <li>• Custom fonts & sizes</li>
                          <li>• Text formatting</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Form Fields
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Add signature fields</li>
                          <li>• Create checkboxes</li>
                          <li>• Insert date fields</li>
                          <li>• Build dropdowns</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileSignature className="w-4 h-4" />
                          Signatures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Multiple signers</li>
                          <li>• Sequential routing</li>
                          <li>• Reminder emails</li>
                          <li>• Audit trail</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <h4 className="font-semibold">Advanced Signature Management</h4>
                  <Badge variant="outline" className="mb-2">Flexible Signing</Badge>
                  <p className="text-muted-foreground">
                    Need to send forms for signatures to more people than originally designed? Our editor makes it easy:
                  </p>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-3">
                    <h5 className="font-medium mb-3">Example Use Cases:</h5>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        <strong>Multiple Buyers:</strong> Add signature fields for additional buyers not on the original form
                      </li>
                      <li>
                        <strong>Co-signers:</strong> Include guarantors or co-signers with full signing capabilities
                      </li>
                      <li>
                        <strong>Witnesses:</strong> Add witness signature lines where required
                      </li>
                      <li>
                        <strong>Additional Parties:</strong> Include attorneys, trustees, or other parties as needed
                      </li>
                    </ul>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Signature Features:</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✓ Drag to position signatures exactly</li>
                        <li>✓ Set signing order and dependencies</li>
                        <li>✓ Add initials and date fields</li>
                        <li>✓ Custom signature labels</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Security & Compliance:</h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>✓ Legally binding e-signatures</li>
                        <li>✓ Complete audit trail</li>
                        <li>✓ Identity verification options</li>
                        <li>✓ Tamper-evident sealing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions about OnRoad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How is OnRoad different from traditional transaction management systems?</AccordionTrigger>
                  <AccordionContent>
                    OnRoad combines transaction management with CRM capabilities and AI automation. Unlike traditional systems, 
                    we automatically populate forms, manage client relationships, and adapt to your workflow. Our system is 
                    designed to reduce manual data entry by up to 80% while ensuring accuracy and compliance.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Can I import my existing templates and forms?</AccordionTrigger>
                  <AccordionContent>
                    Yes! OnRoad supports importing your existing templates. You can upload PDF forms, and our system will 
                    make them fillable and integrate them with our AI automation. You can also create new templates from 
                    successful deals and share them with your team.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>How does the AI form filling work? Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Our AI analyzes the information from your deal and automatically fills matching fields across all forms. 
                    It learns from patterns but never shares data between accounts. All data is encrypted and stored securely. 
                    The AI only has access to your own transaction data and operates within strict privacy guidelines.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>What happens to my clients when I create a deal?</AccordionTrigger>
                  <AccordionContent>
                    When you create a deal, all clients you represent are automatically added to your CRM with their contact 
                    information and deal history. This creates a comprehensive client database without manual entry. You can 
                    access client information, track interactions, and manage relationships all in one place.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I send forms to multiple signers not originally on the form?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely! Our PDF editor allows you to add signature fields for additional parties. Simply drag and drop 
                    new signature fields, assign them to specific signers, and set the signing order. This is perfect for 
                    situations with multiple buyers, co-signers, witnesses, or other parties that need to sign.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>How do client intake templates save time?</AccordionTrigger>
                  <AccordionContent>
                    Client intake templates let you send forms directly to clients for them to fill out. Their responses 
                    automatically populate into your transaction forms, eliminating the need for you to manually transfer 
                    information. Clients can complete forms at their convenience, and you get accurate data directly from 
                    the source.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-7">
                  <AccordionTrigger>What&apos;s the difference between deal-wide forms and property-specific forms?</AccordionTrigger>
                  <AccordionContent>
                    In Buy and Rent deals, deal-wide forms apply to the entire transaction (like buyer representation agreements), 
                    while property-specific forms are for individual properties (like purchase offers). This organization helps 
                    when clients are considering multiple properties. Sell and Lease deals only have one property, so all forms 
                    are related to that single property.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-8">
                  <AccordionTrigger>Can I track multiple properties for one buyer?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Buy and Rent deals support multiple properties because we understand clients often explore several 
                    options. You can add properties, organize forms by property, track different offers, and manage all 
                    property-specific information separately while maintaining deal-wide documentation in one place.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-2">Need More Help?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to help you make the most of OnRoad
              </p>
              <div className="flex justify-center">
                <Link href="/contact" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
                  Contact Support
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function HelpDocsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <HelpDocsContent />
    </Suspense>
  )
}