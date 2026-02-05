import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Moon, Home, Music, Book, User } from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    ...(isAuthenticated ? [
      { href: "/dashboard", label: "Levels", icon: Music },
      { href: "/profile", label: "Profile", icon: User },
    ] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Moon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                NoorTiles
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden sm:block">
                  Salam, {user?.firstName || "Traveler"}
                </span>
                <Button 
                  onClick={() => logout()} 
                  variant="outline" 
                  size="sm"
                  className="rounded-full"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
