import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/Button";

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <ShieldX className="h-16 w-16 text-red-500" />
      <h1 className="text-3xl font-extrabold text-[#3B302B]">403 - Access Denied</h1>
      <p className="text-sm text-[#7A6E65] max-w-md">
        You do not have permission to access this page. Administrative privileges are required.
      </p>
      <Link to="/">
        <Button>Return to Home Page</Button>
      </Link>
    </div>
  );
};

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <ShieldAlert className="h-16 w-16 text-[#596B58]" />
      <h1 className="text-3xl font-extrabold text-[#3B302B]">Session Expired</h1>
      <p className="text-sm text-[#7A6E65] max-w-md">
        Your login session has expired for security reasons. Please sign in with Google again.
      </p>
      <Link to="/auth/login">
        <Button>Log In Again</Button>
      </Link>
    </div>
  );
};
