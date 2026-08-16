import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Shipping Policy | Maison",
  description: "Information about our shipping rates, methods, and delivery times.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="sm">
        <div className="bg-surface p-8 md:p-12 shadow-sm prose prose-sm max-w-none text-muted-foreground">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center font-light">Shipping Policy</h1>
          <p className="mb-6">Last updated: [Date]</p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">1. Order Processing Time</h2>
          <p className="mb-4">
            All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. 
            You will receive another notification when your order has shipped.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">2. Domestic Shipping Rates and Estimates</h2>
          <p className="mb-4">
            Shipping charges for your order will be calculated and displayed at checkout.
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Standard Shipping:</strong> 3-5 business days. Free for orders over $150. Otherwise, a flat rate of $8.99 applies.</li>
            <li><strong>Expedited Shipping:</strong> 1-2 business days. Flat rate of $15.99.</li>
          </ul>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">3. International Shipping</h2>
          <p className="mb-4">
            We currently do not offer international shipping. We only ship to addresses within the contiguous United States, Alaska, and Hawaii.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">4. How do I check the status of my order?</h2>
          <p className="mb-4">
            When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. 
            Please allow 48 hours for the tracking information to become available.
          </p>
          <p className="mb-4">
            If you haven't received your order within 5 days of receiving your shipping confirmation email, please contact us at support@maison.com with your name and order number, and we will look into it for you.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">5. Refunds, returns, and exchanges</h2>
          <p className="mb-4">
            Please review our Return Policy for detailed information on options and procedures for returning your order.
          </p>
        </div>
      </Container>
    </div>
  );
}
