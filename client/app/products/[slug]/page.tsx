import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartForm } from "@/components/product/AddToCartForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProductBySlug, getProducts } from "@/lib/api/products";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params;
  try {
    const product = await getProductBySlug(params.slug);
    return {
      title: product.name,
      description: product.description || `Buy ${product.name} at Maison.`,
    };
  } catch {
    return {
      title: "Product Not Found",
    };
  }
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;

  let product;
  try {
    product = await getProductBySlug(params.slug);
  } catch {
    notFound();
  }

  // Fetch related products (same category)
  let relatedProducts: import("@/lib/types/catalog").Product[] = [];
  try {
    const relatedResponse = await getProducts({
      category: product.category?.slug,
      limit: 5, // Fetch 5 to ensure we have 4 excluding the current one
    });
    relatedProducts = relatedResponse.products
      .filter((p) => p.id !== product.id)
      .slice(0, 4);
  } catch (error) {
    console.error("Failed to fetch related products", error);
  }

  const categoryUrl = product.category
    ? `/categories/${product.category.slug}`
    : "/shop";
  const categoryName = product.category?.name || "Shop";

  const isOnSale = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  
  // Format images for the gallery
  const images = product.images?.length 
    ? product.images 
    : [{ url: "/images/placeholder.jpg", alt: "Placeholder" }];

  return (
    <div className="pb-24 pt-12">
      <Container>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={categoryUrl} className="hover:text-foreground">
                {categoryName}
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 mb-24">
          {/* Gallery */}
          <div className="w-full lg:w-1/2">
            <ProductGallery images={images} />
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-8">
            <div className="mb-8 border-b border-border pb-8">
              <h1 className="font-display text-display-md font-light text-foreground mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-4">
                <span className="text-2xl tracking-wide text-foreground">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                {isOnSale && (
                  <>
                    <span className="text-lg tracking-wide text-muted-foreground line-through">
                      ${parseFloat(product.compareAtPrice!).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                      Sale
                    </span>
                  </>
                )}
              </div>
            </div>

            {product.description && (
              <div className="prose prose-sm md:prose-base text-muted-foreground mb-8">
                <p>{product.description}</p>
              </div>
            )}

            <div className="mb-10 text-sm text-muted-foreground">
              <p>SKU: {product.sku}</p>
            </div>

            <AddToCartForm productId={product.id} isAvailable={product.isActive} />

            <div className="mt-12 space-y-6 border-t border-border pt-8 text-sm text-muted-foreground">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-medium text-foreground">Shipping</span>
                <span>Free shipping on orders over $150</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-medium text-foreground">Returns</span>
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Reviews Section */}
        <section className="mb-24 border-t border-border pt-16">
          <h2 className="font-display text-3xl font-light mb-10 text-center">
            Customer Reviews
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Review 1 */}
            <div className="bg-surface p-8">
              <div className="flex items-center gap-1 mb-4 text-foreground">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <h3 className="font-medium text-foreground mb-2">Beautiful piece!</h3>
              <p className="text-muted-foreground text-sm mb-4">
                "I am absolutely in love with this product. It looks exactly like the pictures and the quality is outstanding. Highly recommend!"
              </p>
              <p className="text-xs text-muted-foreground">— Sarah M.</p>
            </div>
            
            {/* Review 2 */}
            <div className="bg-surface p-8">
              <div className="flex items-center gap-1 mb-4 text-foreground">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <h3 className="font-medium text-foreground mb-2">Perfect addition to my home</h3>
              <p className="text-muted-foreground text-sm mb-4">
                "The craftsmanship is exceptional. It arrived perfectly packaged and earlier than expected. Will be purchasing more from Maison."
              </p>
              <p className="text-xs text-muted-foreground">— James L.</p>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border pt-16">
            <h2 className="font-display text-3xl font-light mb-10">
              You May Also Like
            </h2>
            <ProductGrid products={relatedProducts} columns={4} />
          </section>
        )}
      </Container>
    </div>
  );
}
