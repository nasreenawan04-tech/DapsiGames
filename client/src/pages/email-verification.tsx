import { useState } from "react";
import { Link } from "wouter";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resendVerificationEmail } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  email?: string;
}

export default function EmailVerification({ email }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please sign up again to receive a verification email.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(email);
      setResendSuccess(true);
      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-verification-title">
            Check Your Email
          </CardTitle>
          <CardDescription data-testid="text-verification-description">
            We've sent a verification link to {email ? <strong>{email}</strong> : "your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Click the link in your email to verify your account and start learning with DapsiGames.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Didn't receive the email?</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Check your spam or junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            {resendSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification email sent successfully!
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={isResending || !email}
              data-testid="button-resend-email"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>

            <div className="pt-4 border-t text-center">
              <Link href="/login">
                <a className="text-sm text-primary hover:underline" data-testid="link-back-to-login">
                  Back to Login
                </a>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
