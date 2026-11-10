import type { Metadata } from "next";
import { Dna, TriangleAlert } from "lucide-react";
import { PLATFORM_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "RxGenomics usability study",
  robots: { index: false, follow: false },
};

/**
 * Deliberately plain chrome: no sidebar or links to the rest of the app, so a
 * participant cannot wander out of the session mid-task.
 */
export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
        <TriangleAlert className="size-3.5 shrink-0" />
        Research prototype for a usability study. Not for clinical use.
      </div>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-semibold">
            <Dna className="size-5 text-primary" />
            RxGenomics
          </span>
          <span className="font-mono text-xs text-muted-foreground">v{PLATFORM_VERSION}</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
