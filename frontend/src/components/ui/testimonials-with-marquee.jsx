import { cn } from "@/lib/utils"
import { TestimonialCard } from "@/components/ui/testimonial-card";

export function TestimonialsSection({
  title,
  description,
  topTestimonials,
  bottomTestimonials,
  className
}) {
  return (
    <section
      className={cn("bg-background text-foreground", "max-w-6xl mx-auto py-12 sm:py-24 md:py-32 px-0", className)}>
      <div
        className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2
            className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p
            className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl">
            {description}
          </p>
        </div>

        <div
          className="relative flex w-full flex-col items-center justify-center overflow-hidden gap-4">
          {/* First row - left to right */}
          <div
            className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:40s]">
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
              {[...Array(4)].map((_, setIndex) => (
                topTestimonials.map((testimonial, i) => (
                  <TestimonialCard key={`row1-${setIndex}-${i}`} {...testimonial} className="hover:scale-105 transition-transform" />
                ))
              ))}
            </div>
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row group-hover:[animation-play-state:paused]">
              {[...Array(4)].map((_, setIndex) => (
                topTestimonials.map((testimonial, i) => (
                  <TestimonialCard key={`row1-duplicate-${setIndex}-${i}`} {...testimonial} className="hover:scale-105 transition-transform" />
                ))
              ))}
            </div>
          </div>

          {/* Second row - right to left */}
          <div
            className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:45s]">
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-reverse flex-row group-hover:[animation-play-state:paused]">
              {[...Array(4)].map((_, setIndex) => (
                bottomTestimonials.map((testimonial, i) => (
                  <TestimonialCard key={`row2-${setIndex}-${i}`} {...testimonial} className="hover:scale-105 transition-transform" />
                ))
              ))}
            </div>
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-reverse flex-row group-hover:[animation-play-state:paused]">
              {[...Array(4)].map((_, setIndex) => (
                bottomTestimonials.map((testimonial, i) => (
                  <TestimonialCard key={`row2-duplicate-${setIndex}-${i}`} {...testimonial} className="hover:scale-105 transition-transform" />
                ))
              ))}
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  );
}
