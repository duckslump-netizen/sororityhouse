import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "House Merch | Sorority House" },
      {
        name: "description",
        content:
          "Official Sorority House merch — hoodies, tees and everything else from the house. Shop the drop.",
      },
      { property: "og:title", content: "House Merch | Sorority House" },
      {
        property: "og:description",
        content: "Official Sorority House merch. Shop the drop before the doors close.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;

  const handleAddToCart = async () => {
    if (!variant) return;
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
    <div className="group overflow-hidden rounded-2xl border border-border/60 bg-card/60">
      <Link to="/product/$handle" params={{ handle: product.node.handle }} className="block">
        <div className="aspect-square overflow-hidden bg-secondary/20">
          {image && (
            <img
              src={image.url}
              alt={image.altText ?? product.node.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link to="/product/$handle" params={{ handle: product.node.handle }}>
          <h3 className="text-lg font-semibold tracking-tight">{product.node.title}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.node.description}</p>
        <p className="font-bold">
          {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
        </p>
        <Button onClick={handleAddToCart} disabled={isLoading || !variant} className="w-full">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}

function ShopPage() {
  useCartSync();
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(50),
  });

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Back to the house
            </Link>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight">House Merch</h1>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Wear the house. Limited runs, straight from the front door.
            </p>
          </div>
          <CartDrawer />
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-24 text-center text-muted-foreground">
            The shop couldn't load right now. Try again in a moment.
          </p>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-muted-foreground">No products found</p>
        )}
      </div>
    </main>
  );
}
