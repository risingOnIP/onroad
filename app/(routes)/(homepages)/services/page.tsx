import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Home,
  TrendingUp,
  Building,
  Briefcase,
  Calculator,
  FileText,
  Camera,
  BarChart3,
  Zap,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Our Services
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Comprehensive real estate solutions tailored to meet your unique
              needs
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <Home className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Property Buying</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Find your dream home with our comprehensive buying services
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Personalized
                    property search
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Virtual and
                    in-person tours
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Negotiation
                    support
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Legal
                    documentation assistance
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <Building className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Property Selling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Maximize your property&apos;s value with our selling expertise
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Professional
                    property valuation
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Marketing &
                    advertising
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Professional
                    photography
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Buyer
                    screening
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Investment Advisory</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Strategic guidance for real estate investments
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Market
                    analysis & trends
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> ROI
                    calculations
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Portfolio
                    management
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Risk
                    assessment
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <Briefcase className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Property Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Complete property management solutions for landlords
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Tenant
                    screening & placement
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Rent
                    collection
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Maintenance
                    coordination
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Financial
                    reporting
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Mortgage Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Navigate financing with our mortgage experts
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Pre-approval
                    assistance
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Rate
                    comparison
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Lender
                    connections
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />{" "}
                    Documentation support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Legal Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Expert legal support for all real estate transactions
                </CardDescription>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Contract
                    review
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Title search
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Closing
                    coordination
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" /> Dispute
                    resolution
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing options to match your real estate needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>Perfect for first-time buyers</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Property search access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">5 property tours/month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Basic market reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-sm text-muted-foreground">
                      Investment advisory
                    </span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-sm text-muted-foreground">
                      Legal services
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            {/* Professional Plan */}
            <Card className="border-none shadow-xl relative">
              <Badge
                className="absolute -top-3 left-1/2 -translate-x-1/2"
                variant="default"
              >
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>
                  For serious buyers and sellers
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Everything in Basic</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Unlimited property tours</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Negotiation assistance</span>
                  </li>
                  <li className="flex items-center">
                    <X className="h-5 w-5 text-muted-foreground mr-3" />
                    <span className="text-sm text-muted-foreground">
                      Property management
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get Started</Button>
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For investors and agencies</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Everything in Professional</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">White-label options</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Full legal services</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span className="text-sm">Property management</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Premium Add-On Services
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Enhance your experience with our specialized services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6">
                <Camera className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Virtual Tours</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Professional 3D tours and drone photography
                </p>
                <p className="text-lg font-bold">$299/property</p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6">
                <BarChart3 className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Market Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed market reports and forecasting
                </p>
                <p className="text-lg font-bold">$149/report</p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6">
                <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Fast Track</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Expedited processing and priority viewing
                </p>
                <p className="text-lg font-bold">$499/month</p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-6">
                <Globe className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">International</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cross-border transaction support
                </p>
                <p className="text-lg font-bold">Custom pricing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Choose the service that best fits your needs or contact us for a
            custom solution
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                Schedule Consultation
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
