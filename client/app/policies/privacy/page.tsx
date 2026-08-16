import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Privacy Policy | Maison",
  description: "Read our privacy policy to understand how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="sm">
        <div className="bg-surface p-8 md:p-12 shadow-sm prose prose-sm max-w-none text-muted-foreground">
          <h1 className="text-3xl font-display text-foreground mb-8 text-center font-light">Privacy Policy</h1>
          <p className="mb-6">Last updated: [Date]</p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Maison. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">2. The Data We Collect About You</h2>
          <p className="mb-4">
            Personal data, or personal information, means any information about an individual from which that person can be identified.
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Financial Data</strong> includes payment card details (processed securely via our payment providers).</li>
            <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          </ul>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., processing an order).</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">4. Data Security</h2>
          <p className="mb-4">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. 
            In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
          </p>

          <h2 className="text-lg font-medium text-foreground mt-8 mb-4">5. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
            <br />
            Email: privacy@maison.com
          </p>
        </div>
      </Container>
    </div>
  );
}
