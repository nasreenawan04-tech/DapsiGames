import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are now a Pro member!",
      });
    }

    setIsProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Unable to initialize payment. Please try again.");
        }
      })
      .catch((err) => {
        setError("Unable to connect to payment service. Please check your configuration.");
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Payment Setup Required</CardTitle>
            <CardDescription>
              {error || "Stripe configuration is incomplete. Please contact support."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProFeaturesList />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-subscribe-title">
            Upgrade to Pro
          </h1>
          <p className="text-muted-foreground" data-testid="text-subscribe-subtitle">
            Unlock premium features and take your learning to the next level
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Pro Features
              </CardTitle>
              <CardDescription>Everything you get with Pro membership</CardDescription>
            </CardHeader>
            <CardContent>
              <ProFeaturesList />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Secure payment powered by Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm />
                </Elements>
              ) : (
                <p className="text-muted-foreground">Payment system not configured</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProFeaturesList() {
  const features = [
    "Remove all advertisements",
    "Cloud sync across all devices",
    "Advanced analytics and insights",
    "Custom themes and avatars",
    "Unlimited note storage",
    "Priority customer support",
    "Export planner to PDF",
    "Exclusive Pro badges",
  ];

  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2" data-testid={`text-feature-${index}`}>
          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
