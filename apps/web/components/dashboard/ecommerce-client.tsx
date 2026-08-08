"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Store = {
  id: string;
  name: string;
  slug: string;
  status: string;
  currency: string;
  checkout_status: string;
};

type Product = {
  id: string;
  name: string;
  price_cents: number;
  sku: string | null;
  status: string;
  inventory: number | null;
};

export function EcommerceClient() {
  const t = useTranslations("dashboard");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [storeName, setStoreName] = useState("");
  const [productName, setProductName] = useState("");
  const [priceCents, setPriceCents] = useState("0");
  const [error, setError] = useState<string | null>(null);

  async function loadStores() {
    const res = await fetch("/api/stores");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load stores");
      setStores([]);
      return;
    }
    setStores(data.stores ?? []);
  }

  async function loadProducts(storeId: string) {
    const res = await fetch(`/api/stores/${storeId}/products`);
    const data = await res.json();
    setProducts(data.products ?? []);
    // Orders stay empty until Stripe store checkout is wired
    setOrdersCount(0);
  }

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedId) loadProducts(selectedId);
    else setProducts([]);
  }, [selectedId]);

  async function createStore() {
    setError(null);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: storeName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setStoreName("");
    await loadStores();
    if (data.store?.id) setSelectedId(data.store.id);
  }

  async function removeStore(id: string) {
    await fetch(`/api/stores/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    await loadStores();
  }

  async function createProduct() {
    if (!selectedId) return;
    setError(null);
    const res = await fetch(`/api/stores/${selectedId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productName.trim(),
        price_cents: Number.parseInt(priceCents, 10) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setProductName("");
    setPriceCents("0");
    await loadProducts(selectedId);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("ecommerceHint")}</p>
        <Badge variant="secondary">checkout: integration_required</Badge>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground">STORES</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder={t("storeName")}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={createStore} disabled={!storeName.trim()}>
            {t("createStore")}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {stores.length === 0 ? (
          <EmptyState title={t("empty")} description={t("ecommerceEmpty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checkout</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow
                  key={s.id}
                  className={selectedId === s.id ? "bg-muted/40" : undefined}
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.slug}</TableCell>
                  <TableCell>{s.status}</TableCell>
                  <TableCell>{s.checkout_status}</TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedId(s.id)}>
                      {t("manageProducts")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeStore(s.id)}>
                      {t("delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedId ? (
        <div className="space-y-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">PRODUCTS</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder={t("productName")}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="max-w-xs"
            />
            <Input
              placeholder="price_cents"
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="max-w-[8rem]"
            />
            <Button onClick={createProduct} disabled={!productName.trim()}>
              {t("createProduct")}
            </Button>
          </div>
          {products.length === 0 ? (
            <EmptyState title={t("empty")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{(p.price_cents / 100).toFixed(2)}</TableCell>
                    <TableCell>{p.sku ?? "—"}</TableCell>
                    <TableCell>{p.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-sm text-muted-foreground">
            {t("ordersEmpty")} ({ordersCount})
          </p>
        </div>
      ) : null}
    </div>
  );
}
