import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background min-h-svh">
      <header className="border-border bg-background/95 border-b">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-md text-sm font-semibold">
              AG
            </div>
            <div>
              <p className="text-foreground text-sm leading-none font-semibold">
                Apex Global Logistics
              </p>
              <p className="text-muted-foreground mt-1 text-xs">Operations platform</p>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
