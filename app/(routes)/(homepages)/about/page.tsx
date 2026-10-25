import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  Heart,
  Lightbulb,
  Shield,
  Award,
  Users,
  Building,
  Globe,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              About Onroad
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Transforming the real estate industry through innovation,
              integrity, and exceptional service.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To revolutionize the real estate experience by providing
                  innovative technology solutions that empower buyers, sellers,
                  and investors to make informed decisions with confidence. We
                  strive to make property transactions seamless, transparent,
                  and accessible to everyone.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <Lightbulb className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  To become the global leader in real estate technology,
                  creating a world where property transactions are effortless,
                  data-driven, and universally accessible. We envision a future
                  where technology bridges the gap between dreams and reality in
                  real estate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Our Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Integrity</h3>
              <p className="text-muted-foreground">
                We operate with honesty and transparency in all our dealings
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer First</h3>
              <p className="text-muted-foreground">
                Your success is our priority, and we go above and beyond to
                ensure it
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We constantly evolve to bring you cutting-edge solutions
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-muted-foreground">
                We maintain the highest standards in everything we do
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Onroad by the Numbers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our impact in the real estate industry speaks for itself
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-8">
                <h3 className="text-4xl font-bold text-primary mb-2">10K+</h3>
                <p className="text-muted-foreground">Happy Customers</p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-8">
                <h3 className="text-4xl font-bold text-primary mb-2">$2B+</h3>
                <p className="text-muted-foreground">
                  Property Value Transacted
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-8">
                <h3 className="text-4xl font-bold text-primary mb-2">50+</h3>
                <p className="text-muted-foreground">Cities Covered</p>
              </CardContent>
            </Card>

            <Card className="text-center border-none shadow-lg">
              <CardContent className="pt-8">
                <h3 className="text-4xl font-bold text-primary mb-2">98%</h3>
                <p className="text-muted-foreground">Customer Satisfaction</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Meet Our Leadership
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Experienced professionals dedicated to your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-1">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  CEO & Founder
                </p>
                <p className="text-sm text-muted-foreground">
                  20+ years in real estate technology and innovation
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-1">Michael Chen</h3>
                <p className="text-sm text-muted-foreground mb-3">CTO</p>
                <p className="text-sm text-muted-foreground">
                  Former tech lead at major proptech companies
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-1">Emily Rodriguez</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Head of Customer Success
                </p>
                <p className="text-sm text-muted-foreground">
                  Passionate about delivering exceptional experiences
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Why Real Estate Professionals Choose Onroad
            </h2>

            <div className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardContent className="flex items-start pt-6">
                  <Shield className="h-8 w-8 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Industry-Leading Technology
                    </h3>
                    <p className="text-muted-foreground">
                      Our platform is built with the latest technology to ensure
                      fast, secure, and reliable transactions every time.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardContent className="flex items-start pt-6">
                  <Building className="h-8 w-8 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Comprehensive Market Coverage
                    </h3>
                    <p className="text-muted-foreground">
                      Access properties and market data across multiple cities
                      and regions, all in one unified platform.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardContent className="flex items-start pt-6">
                  <Globe className="h-8 w-8 text-primary mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Global Network
                    </h3>
                    <p className="text-muted-foreground">
                      Connect with a worldwide network of real estate
                      professionals and access international property
                      opportunities.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
