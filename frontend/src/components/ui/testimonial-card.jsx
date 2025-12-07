import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function TestimonialCard({ author, text, className }) {
  return (
    <div
      className={cn(
        "flex w-[350px] flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <p className="text-sm font-medium leading-none">{author.name}</p>
          <p className="text-sm text-muted-foreground">{author.handle}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
