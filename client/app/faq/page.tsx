"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

const faqs = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long will it take to receive my order?",
        a: "Orders are typically processed within 1-2 business days. Standard shipping usually takes 3-5 business days, while expedited shipping takes 1-2 business days depending on your location."
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we only ship within the contiguous United States. We are working on expanding our shipping options globally in the near future."
      },
      {
        q: "Can I change or cancel my order?",
        a: "If you need to change or cancel your order, please contact us immediately. We process orders quickly, but we'll do our best to accommodate your request if the order hasn't shipped yet. You can also cancel it directly from your Account Dashboard if it's still in the 'Pending' state."
      }
    ]
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery. Items must be unused, in their original condition, and with all tags attached. Please visit our Returns page to initiate a return."
      },
      {
        q: "Are returns free?",
        a: "We deduct a small flat fee of $5.99 from your refund to cover the return shipping label cost. Exchanges for a different size or color are always free."
      },
      {
        q: "How long does a refund take to process?",
        a: "Once we receive your returned item, please allow 3-5 business days for our team to inspect it and process the refund. It may take an additional 5-10 business days for the funds to appear on your original payment method."
      }
    ]
  },
  {
    category: "Products & Quality",
    questions: [
      {
        q: "Where are your products made?",
        a: "Our products are designed in our New York studio and ethically manufactured by skilled artisans in Portugal, Italy, and Vietnam, depending on the specific product category."
      },
      {
        q: "How do I care for my items?",
        a: "Care instructions vary by material. You can find specific care guidelines on the product page and on the care label attached to the item."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>("0-0");

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="bg-muted/20 min-h-screen section-padding">
      <Container size="sm">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-light mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about our products, shipping, returns, and more.
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <div key={category.category} className="bg-surface p-8 shadow-sm">
              <h2 className="text-xl font-medium mb-6 pb-4 border-b border-border">
                {category.category}
              </h2>
              <div className="space-y-2">
                {category.questions.map((faq, qIndex) => {
                  const id = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === id;
                  
                  return (
                    <div key={id} className="border-b border-border last:border-b-0">
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full text-left py-4 flex items-center justify-between focus:outline-none"
                      >
                        <span className="font-medium pr-8">{faq.q}</span>
                        <span className={`transform transition-transform text-muted-foreground ${isOpen ? "rotate-180" : ""}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
