import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/Reveal";

interface SectionHeaderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description?: string;
}

export function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <Badge className="h-auto gap-1.5 rounded-full border-0 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
        <Icon className="size-3.5" />
        {eyebrow}
      </Badge>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      )}
    </Reveal>
  );
}