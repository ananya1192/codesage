"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { checkout, customer } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { getSubscriptionData, syncSubscriptionStatus } from "@/module/payment/action";

const PLAN_FEATURES = {
  free: [
    { name: "Up to 5 repositories", included: true },
    { name: "Up to 5 reviews per repository", included: true },
    { name: "AI Powered code reviews", included: true },
    { name: "Review history", included: true },
    { name: "Dashboard access", included: true },
  ],
  pro: [
    { name: "Unlimited repositories", included: true },
    { name: "Unlimited AI reviews", included: true },
    { name: "AI powered code reviews", included: true },
    { name: "Email support", included: true },
    { name: "Dashboard access", included: true },
  ],
};

export default function SubscriptionPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const {
  data,
  isLoading,
  error,
  refetch,
} = useQuery({
  queryKey: ["subscription-data"],
  queryFn: getSubscriptionData,
  refetchOnWindowFocus: true,
});

useEffect(() => {
  if (success === "true") {
    const sync = async () => {
      try {
        await syncSubscriptionStatus();
        refetch();
      } catch (e) {
        console.error(
          "Failed to sync subscription on success return",
          e
        );
      }
    };

    sync();
  }
}, [success, refetch]);

if (isLoading) {
  return (
    <div className="flex items-center justify-center-min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

if (error) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-muted-foreground">
          Failed to load subscription data
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            Failed to load subscription data. Please try again.
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

if (!data?.user) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-muted-foreground">
          Please sign in to view subscription options
        </p>
      </div>
    </div>
  );
}

const currentTier = data.user.subscriptionTier as "FREE" | "PRO";
const isPro = currentTier === "PRO";
const isActive = data.user.subscriptionStatus === "ACTIVE";


const cancelAtPeriodEnd =
  data.subscription?.cancelAtPeriodEnd ?? false;

const currentPeriodEnd =
  data.subscription?.currentPeriodEnd;
const handleSync = async () => {
  try {
    setSyncLoading(true);
    console.time("Polar");
    const result = await syncSubscriptionStatus();
    console.timeEnd("Polar");

    if (result.success) {
      toast.success("Subscription status updated");
      refetch();
    } else {
      toast.error("Failed to sync subscription");
    }
  } catch (error) {
    console.error("Failed to sync subscription:", error);
    toast.error("Failed to sync subscription");
  } finally {
    setSyncLoading(false);
  }
};


const handleUpgrade = async () => {
  try {
    setCheckoutLoading(true);

    await checkout({
      slug: "Codesage",
    });
  } catch (error) {
    console.error("Failed to initiate checkout:", error);
    toast.error("Failed to initiate checkout");
  } finally {
    setCheckoutLoading(false);
  }
};


const handleManageSubscription = async () => {
  try {
    setPortalLoading(true);

    await customer.portal();
  } catch (error) {
    console.error("Failed to open portal:", error);
    toast.error("Failed to open customer portal");
  } finally {
    setPortalLoading(false);
  }
};



return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your needs
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncLoading}
      >
        {syncLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Status
          </>
        )}
      </Button>
    </div>


    {success === "true" && (
  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
    <Check className="h-4 w-4 text-green-600" />
    <AlertTitle>Success!</AlertTitle>
    <AlertDescription>
      Your subscription has been updated successfully. Changes may
      take a few moments to reflect.
    </AlertDescription>
  </Alert>
)}

{cancelAtPeriodEnd && (
  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
    <AlertTitle>Subscription Ends Soon</AlertTitle>

    <AlertDescription>
      Your Pro subscription has been canceled.
      <br />
      You'll continue enjoying all Pro features until{" "}
      <strong>
        {currentPeriodEnd
          ? new Date(currentPeriodEnd).toLocaleDateString()
          : "the end of your billing period"}
      </strong>
      .
      <br />
      After that, your account will automatically switch to the Free plan.
    </AlertDescription>
  </Alert>
)}
    
{data.limits && (
  <Card>
    <CardHeader>
      <CardTitle>Current Usage</CardTitle>
      <CardDescription>
        Your current plan limits and usage
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Repositories
            </span>

            <Badge
              variant={
                data.limits.repositories.canAdd
                  ? "default"
                  : "destructive"
              }
            >
              {data.limits.repositories.current} /{" "}
              {data.limits.repositories.limit ?? "∞"}
            </Badge>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${
                data.limits.repositories.canAdd
                  ? "bg-primary"
                  : "bg-destructive"
              }`}
              style={{
                width: data.limits.repositories.limit
                  ? `${Math.min(
                      (data.limits.repositories.current /
                        data.limits.repositories.limit) *
                        100,
                      100
                    )}%`
                  : "100%",
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Reviews per Repository
            </span>

            <Badge variant="outline">
              {isPro ? "Unlimited" : "5 per repo"}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            {isPro
              ? "No limits on reviews."
              : "Free tier allows 5 reviews per repository."}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}


<div className="grid gap-6 md:grid-cols-2">

  <Card className={!isPro ? "ring-2 ring-primary" : ""}>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle>Free</CardTitle>
          <CardDescription>Perfect for getting started</CardDescription>
        </div>

        {!isPro && <Badge className="ml-2">Current Plan</Badge>}
      </div>

      <div className="mt-2">
        <span className="text-3xl font-bold">$0</span>
        <span className="text-muted-foreground">/month</span>
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      <div className="space-y-2">
        {PLAN_FEATURES.free.map((feature) => (
          <div
            key={feature.name}
            className="flex items-center gap-2"
          >
            {feature.included ? (
              <Check className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground shrink-0" />
            )}

            <span
              className={
                feature.included ? "" : "text-muted-foreground"
              }
            >
              {feature.name}
            </span>
          </div>
        ))}
      </div>

     <Button
  className="w-full"
  variant="outline"
  onClick={handleManageSubscription}
  disabled={portalLoading}
>
  {portalLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Opening...
    </>
  ) : (
    isPro ? "Downgrade to Free" : "Current Plan"
  )}
</Button>
    </CardContent>
  </Card>

<Card className={isPro ? "ring-2 ring-primary" : ""}>
  <CardHeader>
    <div className="flex items-start justify-between">
      <div>
        <CardTitle>Pro</CardTitle>
        <CardDescription>For professional developers</CardDescription>
      </div>

      {isPro && <Badge className="ml-2">Current Plan</Badge>}
    </div>

    <div className="mt-2">
      <span className="text-3xl font-bold">$99.99</span>
      <span className="text-muted-foreground">/month</span>
    </div>
  </CardHeader>

  <CardContent className="space-y-4">
    <div className="space-y-2">
      {PLAN_FEATURES.pro.map((feature) => (
        <div
          key={feature.name}
          className="flex items-center gap-2"
        >
          {feature.included ? (
            <Check className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          <span
            className={
              feature.included ? "" : "text-muted-foreground"
            }
          >
            {feature.name}
          </span>
        </div>
      ))}
    </div>

    {isPro && isActive ? (
      <Button
        className="w-full"
        variant="outline"
        onClick={handleManageSubscription}
        disabled={portalLoading}
      >
        {portalLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening Portal...
          </>
        ) : (
          <>
            Manage Subscription
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    ) : (
      <Button
        className="w-full"
        onClick={handleUpgrade}
        disabled={checkoutLoading}
      >
        {checkoutLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Checkout...
          </>
        ) : (
          "Upgrade to Pro"
        )}
      </Button>
    )}
  </CardContent>
</Card>
  </div>
  </div>
);
}