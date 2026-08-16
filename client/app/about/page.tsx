import { Container } from "@/components/ui/Container";
import Image from "next/image";

export const metadata = {
  title: "About Us | Maison",
  description: "Learn more about Maison, our mission, and our team.",
};

export default function AboutPage() {
  return (
    <div className="bg-muted/20 min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-surface">
        <Container size="default">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="font-display text-4xl md:text-5xl font-light">About Maison</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We believe in crafting timeless pieces that elevate your everyday life. 
              Maison was born out of a desire to create a modern aesthetic that balances 
              minimalism with warmth.
            </p>
          </div>
        </Container>
      </section>

      {/* Image & Mission Section */}
      <section className="section-padding">
        <Container size="default">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[4/5] bg-muted w-full">
              {/* Placeholder image, in a real app this would be a real image */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                [Brand Image Placeholder]
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="font-display text-3xl">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Maison, our mission is simple: to provide high-quality, beautifully designed 
                products that seamlessly integrate into your home. We source our materials 
                sustainably and work with artisans who share our commitment to craftsmanship.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We're not just selling products; we're offering a lifestyle—one that values 
                intentionality, quality over quantity, and the quiet beauty of well-made things.
              </p>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Values Section */}
      <section className="section-padding bg-surface">
        <Container size="default">
          <h2 className="font-display text-3xl text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <h3 className="font-medium text-lg mb-3">Quality Craftsmanship</h3>
              <p className="text-muted-foreground text-sm">Every piece is meticulously crafted to ensure longevity and durability.</p>
            </div>
            <div className="p-6">
              <h3 className="font-medium text-lg mb-3">Sustainable Sourcing</h3>
              <p className="text-muted-foreground text-sm">We are committed to ethical practices and minimizing our environmental impact.</p>
            </div>
            <div className="p-6">
              <h3 className="font-medium text-lg mb-3">Minimalist Design</h3>
              <p className="text-muted-foreground text-sm">We embrace simplicity, focusing on clean lines and essential forms.</p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
