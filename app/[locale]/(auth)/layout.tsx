import React from "react";
import { Logo } from "@/components/shared/logo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute left-4 top-4">
        <Logo size="lg" />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;
