import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Building2, Users, Briefcase, CalendarDays, FileText, BarChart3, Shield, CheckCircle } from "lucide-react";
import { translations } from "@/lib/translations";
import { DicaLogo } from "@/components/dica-logo";

const features = [
  {
    icon: Users,
    title: translations.landing.features.employees,
    description: translations.landing.features.employeesDesc,
  },
  {
    icon: Briefcase,
    title: translations.landing.features.posts,
    description: translations.landing.features.postsDesc,
  },
  {
    icon: CalendarDays,
    title: translations.landing.features.allocation,
    description: translations.landing.features.allocationDesc,
  },
  {
    icon: FileText,
    title: translations.landing.features.documents,
    description: translations.landing.features.documentsDesc,
  },
  {
    icon: BarChart3,
    title: translations.landing.features.reports,
    description: translations.landing.features.reportsDesc,
  },
  {
    icon: Shield,
    title: translations.landing.features.audit,
    description: translations.landing.features.auditDesc,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DicaLogo className="h-9 w-9" />
              <span className="text-lg font-semibold">{translations.branding.appName}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild data-testid="button-login">
                <a href="/api/login">{translations.auth.login}</a>
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
                {translations.landing.title}
              </h1>
              <p className="mt-2 text-xl text-muted-foreground">
                {translations.landing.subtitle}
              </p>
              <p className="mt-4 text-lg text-muted-foreground" data-testid="text-hero-description">
                {translations.landing.description}
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">{translations.landing.loginButton}</a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">{translations.common.learnMore}</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl" data-testid="text-features-title">
                {translations.landing.everythingYouNeed}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {translations.landing.completeTools}
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
                  <CardTitle className="text-xl font-semibold">{translations.landing.roleBasedAccess}</CardTitle>
                  <CardDescription>
                    {translations.landing.accessLevelsDesigned}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-medium">{translations.roles.admin}</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {translations.landing.fullAccessModules}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {translations.landing.userManagementSettings}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {translations.landing.uploadDocManagement}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {translations.landing.reportGeneration}
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{translations.roles.viewer}</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          {translations.landing.viewAllRecords}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          {translations.landing.accessReportsAnalytics}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          {translations.landing.exportDataCsv}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          {translations.landing.downloadDocuments}
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
              <DicaLogo className="h-5 w-5" />
              <span className="text-sm text-muted-foreground">
                {translations.branding.fullTitle}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {translations.landing.solutionForContracts}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
