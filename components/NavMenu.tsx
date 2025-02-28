"use client";

import Link from "next/link";
import { Button } from "./ui";
import { useAuth } from "../app/lib/auth-context";

export default function NavMenu() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="flex items-center">
      {!loading && (
        <>
          {user ? (
            <>
              <span className="mr-4 text-sm hidden md:inline">
                Welcome, {user.username}
              </span>
              <Link href="/dashboard">
                <Button className="mr-2">Dashboard</Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => logout()}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="mr-2">Login</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="mr-2">Sign Up</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}