"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function CheckoutReturnClient({ sessionId }: { sessionId: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/session-status?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Unable to load session status");
          return;
        }
        if (cancelled) return;
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
        if (data.status === "open") {
          router.replace("/pricing");
        }
      } catch {
        if (!cancelled) setError("Unable to load session status");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout status unavailable</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button asChild className="mt-8">
          <Link href="/pricing">Back to pricing</Link>
        </Button>
      </div>
    );
  }

  if (!status || status === "open") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground">
        Confirming your payment…
      </div>
    );
  }

  if (status === "complete") {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Thanks for your order</h1>
        <p className="mt-4 text-muted-foreground">
          We appreciate your business
          {customerEmail ? (
            <>
              . A confirmation email will be sent to <span className="text-foreground">{customerEmail}</span>
            </>
          ) : null}
          .
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/onboarding?checkout=success">Continue onboarding</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/billing">Billing</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout incomplete</h1>
      <p className="mt-3 text-muted-foreground">Status: {status}</p>
      <Button asChild className="mt-8">
        <Link href="/pricing">Try again</Link>
      </Button>
    </div>
  );
}
