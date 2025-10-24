import { Trophy, Mail, Github, Twitter } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DapsiGames
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn while you play. Compete, achieve, and master new subjects through gamified learning.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/study">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-study">Study Materials</span>
                </Link>
              </li>
              <li>
                <Link href="/games">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-games">Games</span>
                </Link>
              </li>
              <li>
                <Link href="/leaderboard">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-leaderboard">Leaderboard</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="https://replit.com/@piyohah692/DapsiGames#client/src/pages/about.tsx">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-contact">Contact</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-privacy">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service">
                  <span className="hover:text-foreground transition-colors cursor-pointer" data-testid="link-footer-terms">Terms of Service</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Connect</h3>
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="p-2 rounded-md hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground"
                aria-label="Email"
                data-testid="link-footer-email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-md hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground"
                aria-label="GitHub"
                data-testid="link-footer-github"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-md hover-elevate active-elevate-2 text-muted-foreground hover:text-foreground"
                aria-label="Twitter"
                data-testid="link-footer-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DapsiGames. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
