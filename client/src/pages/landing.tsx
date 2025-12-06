import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Users, Briefcase, CalendarDays, FileText, BarChart3, Shield, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Employee Management",
    description: "Complete CRUD for employee records with CPF, function, unit, and status tracking.",
  },
  {
    icon: Briefcase,
    title: "Service Posts",
    description: "Manage service posts from Petrobras contracts with modality tracking.",
  },
  {
    icon: CalendarDays,
    title: "Daily Allocation",
    description: "Track daily employee allocations with attendance status and reports.",
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Upload and manage ASO, certifications, and contractual evidence.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Generate monthly allocation reports and occurrence summaries.",
  },
  {
    icon: Shield,
    title: "Audit Trail",
    description: "Complete audit logging for all system operations and changes.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Gestao Contratual</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild data-testid="button-login">
                <a href="/api/login">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl" data-testid="text-hero-title">
                Contract Management System
              </h1>
              <p className="mt-4 text-lg text-muted-foreground" data-testid="text-hero-description">
                Complete solution for contract oversight and management. Track employees, 
                service posts, daily allocations, and maintain full documentation compliance.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">Get Started</a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" data-testid="text-features-title">
                Everything You Need
              </h2>
              <p className="mt-2 text-muted-foreground">
                Comprehensive tools for contract oversight and compliance management.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="border bg-card" data-testid={`card-feature-${index}`}>
                  <CardHeader className="pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-medium mt-3">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <Card className="border-2 border-primary/20 bg-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-semibold">Role-Based Access Control</CardTitle>
                  <CardDescription>
                    Two access levels designed for your workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-medium">Administrator</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          Full CRUD access to all modules
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          User management and settings
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          Document upload and management
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          Report generation and export
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Viewer</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          View all records and data
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          Access reports and analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          Export data to CSV
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          Download documents
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Gestao Contratual - Contract Management System
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Contract Oversight Solution
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
