import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchProductByHandle } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/product/$handle")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Merch Detail | Sorority House" },
      {
        name: "description",
        content: "Product details for official Sorority House merch — sizes, price and checkout.",
      },
      { property: "og:title", content: "Merch Detail | Sorority House" },
      {
        property: "og:description",
        content: "Product details for official Sorority House merch.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProductPage() {
  useCartSync();
  const { handle } = Route.useParams();
  const addItem = useCartStore((s) => s.addItem);
  const isAdding = useCartStore((s) => s.isLoading);
  const [variantIndex, setVariantIndex] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["shopify-product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });

  const variant = product?.node.variants.edges[variantIndex]?.node;
  const image = product?.node.images.edges[0]?.node;

  const handleAddToCart = async () => {
    if (!product || !variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/shop" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Back to merch
          </Link>
          <CartDrawer />
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !product ? (
          <p className="py-24 text-center text-muted-foreground">This item isn't available.</p>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            <div className="aspect-square overflow-hidden rounded-2xl bg-secondary/20">
              {image && (
                <img
                  src={image.url}
                  alt={image.altText ?? product.node.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-black uppercase tracking-tight">{product.node.title}</h1>
              {variant && (
                <p className="text-2xl font-bold">
                  {variant.price.currencyCode} {parseFloat(variant.price.amount).toFixed(2)}
                </p>
              )}
              <p className="whitespace-pre-line text-muted-foreground">{product.node.description}</p>

              {product.node.variants.edges.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {product.node.variants.edges.map((v, i) => (
                    <Button
                      key={v.node.id}
                      variant={i === variantIndex ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVariantIndex(i)}
                      disabled={!v.node.availableForSale}
                    >
                      {v.node.title}
                    </Button>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={isAdding || !variant?.availableForSale}
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
