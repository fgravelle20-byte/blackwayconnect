"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureEvent } from "@/lib/posthog/client";

export function RequestQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/studio/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          offer_slug: form.get("offer_slug"),
          description: form.get("description"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      captureEvent("quote_request_submitted");
      setDone(true);
    } catch {
      alert("Could not submit request. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="text-sm text-muted-foreground">Thank you â€” we received your request and will respond shortly.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="description">Project description</Label>
        <Textarea id="description" name="description" required className="mt-1" rows={5} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Sendingâ€¦" : "Submit request"}</Button>
    </form>
  );
}
