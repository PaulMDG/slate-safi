import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, children, action }: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">{title}</h1>
        {children ? <div className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}