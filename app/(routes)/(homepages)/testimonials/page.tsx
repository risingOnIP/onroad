import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Star,
  Quote,
  Play,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "First-time Homebuyer",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "Onroad made my first home buying experience incredibly smooth. Their team guided me through every step, from finding the perfect property to closing the deal. I couldn't be happier with my new home!",
      highlight: "Closed in just 30 days",
    },
    {
      name: "David Chen",
      role: "Real Estate Investor",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "As an investor, I need accurate market data and quick transactions. Onroad delivers on both fronts. Their analytics tools have helped me identify profitable opportunities I would have missed otherwise.",
      highlight: "20% ROI on first investment",
    },
    {
      name: "Emma Rodriguez",
      role: "Property Seller",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "I was amazed at how quickly Onroad sold my property. Their marketing strategy and professional photography made all the difference. We received multiple offers above asking price!",
      highlight: "Sold 15% above asking",
    },
    {
      name: "Michael Thompson",
      role: "Commercial Property Owner",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "The property management services from Onroad are exceptional. They handle everything from tenant screening to maintenance, allowing me to focus on growing my portfolio.",
      highlight: "99% occupancy rate",
    },
    {
      name: "Lisa Anderson",
      role: "Relocating Professional",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "Moving across the country was stressful, but Onroad made finding a new home easy. Their virtual tours saved me multiple trips, and they negotiated a great deal on my behalf.",
      highlight: "Found home in 2 weeks",
    },
    {
      name: "James Wilson",
      role: "Luxury Home Buyer",
      rating: 5,
      image: "/api/placeholder/100/100",
      text: "The white-glove service from Onroad exceeded my expectations. They understood exactly what I was looking for and presented only the finest properties that matched my criteria.",
      highlight: "Exclusive off-market deal",
    },
  ];

  const successStories = [
    {
      title: "From Renting to Owning",
      client: "The Johnson Family",
      story:
        "After years of renting, the Johnson family finally achieved their dream of homeownership. With Onroad's guidance, they navigated the competitive market and secured a beautiful family home within their budget.",
      outcome: "Saved $50,000 through strategic negotiation",
      icon: Home,
    },
    {
      title: "Building a Real Estate Empire",
      client: "Alexandra Park",
      story:
        "Starting with a single rental property, Alexandra used Onroad's investment advisory services to build a portfolio of 15 properties in just 3 years, generating substantial passive income.",
      outcome: "Portfolio value: $5.2 million",
      icon: TrendingUp,
    },
    {
      title: "Downsizing Made Easy",
      client: "The Williams Couple",
      story:
        "Empty nesters looking to downsize, the Williams found the perfect condo through Onroad. The team handled both the sale of their family home and the purchase of their new property simultaneously.",
      outcome: "Seamless transition with zero downtime",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Client Success Stories
            </h1>
            <p className="mt-6 text-xl text-muted-foreground">
              Discover how Onroad has helped thousands achieve their real estate
              goals
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                10,000+
              </div>
              <p className="text-muted-foreground mt-2">Happy Clients</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                4.9/5
              </div>
              <p className="text-muted-foreground mt-2">Average Rating</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                98%
              </div>
              <p className="text-muted-foreground mt-2">Client Satisfaction</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary">
                $2B+
              </div>
              <p className="text-muted-foreground mt-2">Properties Sold</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              What Our Clients Say
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from real people who found success with Onroad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-none shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mr-4" />
                      <div>
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <Quote className="h-8 w-8 text-primary/20" />
                  </div>
                  <div className="flex mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {testimonial.highlight}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Video Testimonials
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear directly from our clients about their experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, index) => (
              <Card
                key={index}
                className="border-none shadow-lg overflow-hidden group cursor-pointer"
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 text-primary ml-1" />
                    </div>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-1">
                    Success Story #{index + 1}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Watch how Onroad helped achieve real estate success
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Success Stories</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Detailed case studies of remarkable real estate journeys
            </p>
          </div>

          <div className="space-y-8">
            {successStories.map((story, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    <div className="lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                          <story.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">
                            {story.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {story.client}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {story.story}
                      </p>
                    </div>
                    <div className="text-center lg:text-right">
                      <div className="inline-flex items-center bg-primary/10 rounded-lg px-6 py-3">
                        <Award className="h-5 w-5 text-primary mr-2" />
                        <span className="font-semibold text-primary">
                          {story.outcome}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Awards & Recognition
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry recognition for our commitment to excellence
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              "Best Real Estate Platform 2024",
              "Customer Service Excellence",
              "Innovation in PropTech",
              "Top Rated on Trustpilot",
            ].map((award, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-12 w-12 text-primary" />
                </div>
                <p className="font-medium">{award}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Join Thousands of Satisfied Clients
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Start your success story with Onroad today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                Get Started Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Schedule a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
