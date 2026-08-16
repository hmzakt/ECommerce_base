import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Return & Refund Policy | Maison",
  description: "Information about our return, exchange, and refund policies.",
};

export default function RefundPolicyPage() {
  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="sm">
        <div className="bg-surface p-8 md:p-12 shadow-sm prose prose-sm max-w-none text-muted-foreground">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center font-light">Return & Refund Policy</h1>
          <p className="mb-6">Last updated: [Date]</p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">1. Returns</h2>
          <p className="mb-4">
            We have a 30-day return policy, which means you have 30 days after receiving your item to request a return.
          </p>
          <p className="mb-4">
            To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, 
            with tags, and in its original packaging. You'll also need the receipt or proof of purchase.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">2. Starting a Return</h2>
          <p className="mb-4">
            To start a return, you can contact us at returns@maison.com. If your return is accepted, we'll send you a 
            return shipping label, as well as instructions on how and where to send your package. Items sent back to us 
            without first requesting a return will not be accepted.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">3. Damages and Issues</h2>
          <p className="mb-4">
            Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you 
            receive the wrong item, so that we can evaluate the issue and make it right.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">4. Exceptions / Non-returnable Items</h2>
          <p className="mb-4">
            Certain types of items cannot be returned, like perishable goods, custom products (such as special orders or personalized items), 
            and personal care goods (such as beauty products). Please get in touch if you have questions or concerns about your specific item.
          </p>
          <p className="mb-4">
            Unfortunately, we cannot accept returns on sale items or gift cards.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">5. Exchanges</h2>
          <p className="mb-4">
            The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, 
            make a separate purchase for the new item.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">6. Refunds</h2>
          <p className="mb-4">
            We will notify you once we've received and inspected your return, and let you know if the refund was approved or not. 
            If approved, you'll be automatically refunded on your original payment method. Please remember it can take some time 
            for your bank or credit card company to process and post the refund too.
          </p>
          <p className="mb-4">
            Note: A flat fee of $5.99 will be deducted from your refund to cover the return shipping label cost.
          </p>
        </div>
      </Container>
    </div>
  );
}
