import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Terms & Conditions | Maison",
  description: "Read our terms and conditions.",
};

export default function TermsPage() {
  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="sm">
        <div className="bg-surface p-8 md:p-12 shadow-sm prose prose-sm max-w-none text-muted-foreground">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center font-light">Terms & Conditions</h1>
          <p className="mb-6">Last updated: [Date]</p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") 
            and Maison ("we," "us" or "our"), concerning your access to and use of our website as well as any other media form, 
            media channel, mobile website or mobile application related, linked, or otherwise connected thereto.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">2. Intellectual Property Rights</h2>
          <p className="mb-4">
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, 
            website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, 
            service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">3. User Representations</h2>
          <p className="mb-4">
            By using the Site, you represent and warrant that:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>All registration information you submit will be true, accurate, current, and complete.</li>
            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
            <li>You have the legal capacity and you agree to comply with these Terms and Conditions.</li>
            <li>You will not use the Site for any illegal or unauthorized purpose.</li>
          </ul>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">4. Products and Pricing</h2>
          <p className="mb-4">
            We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Site. 
            However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors.
            All products are subject to availability, and we cannot guarantee that items will be in stock.
            We reserve the right to discontinue any products at any time for any reason. Prices for all products are subject to change.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p className="mb-4">
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
            <br />
            Email: legal@maison.com
          </p>
        </div>
      </Container>
    </div>
  );
}
