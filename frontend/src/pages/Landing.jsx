import HeroSection from "../components/hero-section";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"
import { Component as Footer } from "@/components/ui/footer-taped-design";

const topRowTestimonials = [
  {
    author: {
      name: "Dr. Emma Thompson",
      handle: "@emmaresearch",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "Neurolytics has transformed our research workflow. We can now deploy complex behavioral studies with the same precision as lab-based experiments, but reach participants globally."
  },
  {
    author: {
      name: "Dr. David Park",
      handle: "@davidcogneuro",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "The no-code interface is incredible. I built a multi-phase attention experiment in hours without writing a single line of code. Game-changer for cognitive science."
  }
]


const bottomRowTestimonials = [
  {
    author: {
      name: "Dr. Sofia Rodriguez",
      handle: "@sofiabehavior",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "The platform's security features give us confidence to handle sensitive participant data. Plus, the data collection is incredibly flexible for large-scale studies."
  },
  {
    author: {
      name: "Dr. Liam Chen",
      handle: "@liampsych",
      avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face"
    },
    text: "Finally, an accessible tool for running sophisticated experiments online. The accuracy rivals our traditional lab setup, and we can recruit diverse participant populations."
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TestimonialsSection
        title="Trusted by researchers"
        description="Join hundreds of labs worldwide using Neurolytics for their behavioral research."
        topTestimonials={topRowTestimonials}
        bottomTestimonials={bottomRowTestimonials}
      />
      <Footer />
    </div>
  );
}
