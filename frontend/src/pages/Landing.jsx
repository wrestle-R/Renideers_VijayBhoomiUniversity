import HeroSection from "../components/hero-section";
import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"
import { Component as Footer } from "@/components/ui/footer-taped-design";

const topRowTestimonials = [
  {
    author: {
      name: "Asha Patel",
      handle: "@ashatreks",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
    },
    text: "Trekky planned an incredible 3-day trek for our group — the guides were top-notch and the scenery was unforgettable. Highly recommended!"
  },
  {
    author: {
      name: "Ravi Kumar",
      handle: "@ravi_explorer",
      avatar: "https://images.unsplash.com/photo-1545996124-1b1d2b6d9590?w=150&h=150&fit=crop&crop=face"
    },
    text: "Booking was seamless and the trip exceeded expectations. Great local guides and well-organized logistics."
  }
]


const bottomRowTestimonials = [
  {
    author: {
      name: "Maya Singh",
      handle: "@maya_travels",
      avatar: "https://images.unsplash.com/photo-1546525806-1f6f51a5d1b6?w=150&h=150&fit=crop&crop=face"
    },
    text: "A fantastic experience from start to finish — the accommodations and food were great after long days on the trail."
  },
  {
    author: {
      name: "Liam Gray",
      handle: "@liam_hikes",
      avatar: "https://images.unsplash.com/photo-1545996124-1b1d2b6d9590?w=150&h=150&fit=crop&crop=face"
    },
    text: "Trekky's itineraries are thoughtfully designed. Perfect balance of challenge and sightseeing. I'll book again for sure."
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TestimonialsSection
        title="What trekkers say"
        topTestimonials={topRowTestimonials}
        bottomTestimonials={bottomRowTestimonials}
      />
      <Footer />
    </div>
  );
}
