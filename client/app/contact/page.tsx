"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    // Simulate an API call
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate a random error for demonstration purposes (10% chance)
          if (Math.random() < 0.1) {
            reject(new Error("Failed to send message. Please try again later."));
          } else {
            resolve(true);
          }
        }, 1500);
      });
      
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="bg-muted/20 min-h-screen section-padding">
      <Container size="sm">
        <div className="bg-surface p-8 md:p-12 shadow-sm">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-light mb-4">Contact Us</h1>
            <p className="text-muted-foreground">
              Have a question, feedback, or need assistance? We'd love to hear from you.
            </p>
          </div>

          {status === "success" ? (
            <div className="bg-green-50 text-green-700 p-8 text-center border border-green-200">
              <div className="text-3xl mb-4">✨</div>
              <h2 className="text-xl font-medium mb-2">Message Sent Successfully!</h2>
              <p className="text-sm">
                Thank you for reaching out. We've received your message and will get back to you within 24-48 hours.
              </p>
              <button 
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm underline underline-offset-4 hover:text-green-900"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="bg-red-50 text-red-600 p-4 text-sm border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border border-border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent text-sm"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border border-border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent text-sm resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/80 transition-colors font-medium text-sm tracking-wide disabled:opacity-50 disabled:pointer-events-none"
              >
                {status === "submitting" ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}

          <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-2">Customer Service</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Email: support@maison.com<br />
                Phone: +1 (800) 123-4567<br />
                Hours: Mon-Fri, 9am-5pm EST
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Headquarters</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                123 Design Avenue<br />
                Suite 456<br />
                New York, NY 10001
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
