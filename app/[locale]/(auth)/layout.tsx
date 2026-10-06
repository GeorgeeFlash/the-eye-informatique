import React from "react";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-background via-muted/15 to-background">
      {/* Top Header */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="lg" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-4" />
            <span>The Eye Store</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        © {new Date().getFullYear()} The Eye Informatique. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;
