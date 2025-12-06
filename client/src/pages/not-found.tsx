import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { translations } from "@/lib/translations";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-404-title">
              404 - {translations.notFound.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground" data-testid="text-404-description">
              {translations.notFound.description}
            </p>
            <Button asChild className="mt-6" data-testid="button-back-home">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                {translations.notFound.backHome}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
