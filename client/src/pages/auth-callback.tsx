import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          setStatus('success');
          
          setTimeout(() => {
            if (type === 'recovery') {
              setLocation('/auth/reset-password');
            } else {
              setLocation('/dashboard');
            }
          }, 2000);
        } else {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }

          if (session) {
            setStatus('success');
            setTimeout(() => {
              setLocation('/dashboard');
            }, 2000);
          } else {
            throw new Error('No session found');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred during authentication');
      }
    }

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {status === 'loading' && (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-8 w-8 text-secondary" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-callback-title">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription data-testid="text-callback-description">
            {status === 'loading' && 'Please wait while we verify your account'}
            {status === 'success' && 'Your account has been verified. Redirecting...'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent className="text-center">
            <Button
              onClick={() => setLocation('/login')}
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
