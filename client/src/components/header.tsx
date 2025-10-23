import { Link, useLocation } from "wouter";
import { Menu, X, Trophy, User, LogOut, Settings, Award } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  isAuthenticated?: boolean;
  user?: {
    fullName: string;
    points: number;
    avatarUrl?: string;
  };
  onLogout?: () => void;
}

export function Header({ isAuthenticated = false, user, onLogout }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = isAuthenticated
    ? [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/pomodoro", label: "Timer" },
        { path: "/tasks", label: "Tasks" },
        { path: "/study", label: "Study" },
        { path: "/games", label: "Games" },
        { path: "/leaderboard", label: "Leaderboard" },
      ]
    : [
        { path: "/", label: "Home" },
        { path: "/leaderboard", label: "Leaderboard" },
        { path: "/guest", label: "Try Demo" },
      ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <span className="flex items-center gap-2 font-bold text-xl hover-elevate rounded-md px-2 py-1 cursor-pointer" data-testid="link-home">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DapsiGames
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors hover-elevate cursor-pointer ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover-elevate active-elevate-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium">{user.fullName.split(' ')[0]}</span>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {user.points} pts
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/profile">
                  <DropdownMenuItem data-testid="link-profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile">
                  <DropdownMenuItem data-testid="link-achievements" className="cursor-pointer">
                    <Award className="mr-2 h-4 w-4" />
                    Achievements
                  </DropdownMenuItem>
                </Link>
                <Link href="/profile">
                  <DropdownMenuItem data-testid="link-settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  data-testid="button-logout"
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <span className="cursor-pointer" data-testid="button-login">
                  <Button variant="ghost" className="hover-elevate active-elevate-2" asChild>
                    <span>Login</span>
                  </Button>
                </span>
              </Link>
              <Link href="/signup">
                <span className="cursor-pointer" data-testid="button-signup">
                  <Button asChild>
                    <span>Sign Up</span>
                  </Button>
                </span>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover-elevate active-elevate-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col px-4 py-4 gap-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-md font-medium hover-elevate active-elevate-2 cursor-pointer ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link href="/login">
                  <span className="cursor-pointer" data-testid="button-mobile-login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full" asChild>
                      <span>Login</span>
                    </Button>
                  </span>
                </Link>
                <Link href="/signup">
                  <span className="cursor-pointer" data-testid="button-mobile-signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" asChild>
                      <span>Sign Up</span>
                    </Button>
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
