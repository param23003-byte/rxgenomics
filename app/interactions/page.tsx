import type { Metadata } from "next";
import { FlaskConical, Info } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { PgxEvaluator } from "@/components/dashboard/pgx-evaluator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { drugCatalog, GENE_HINTS } from "@/lib/engine/catalog";

export const metadata: Metadata = {
  title: "Drug-Gene Interaction Evaluator | RxGenomics",
  description: "Evaluate pharmacogenomic drug-gene interactions against CPIC Level A guidelines.",
};

export default function InteractionsPage() {
  const drugs = drugCatalog();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Drug-Gene Interaction</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
          Research prototype for a usability study. Not for clinical use.
        </div>

        <main className="flex-1 overflow-auto bg-background">
          <div className="container max-w-7xl px-4 py-8 md:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
                  <FlaskConical className="size-4" /> Clinical pharmacogenomics
                </div>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
                  Drug-gene interaction evaluator
                </h1>
                <p className="mt-2 max-w-2xl leading-6 text-muted-foreground">
                  Enter a patient&apos;s genotype and the drug you plan to prescribe. RxGenomics assigns the CPIC
                  phenotype and returns the matching recommendation, covering {drugs.length} CPIC Level A drugs.
                </p>
              </div>
              <Badge variant="outline" className="w-fit gap-2 px-3 py-1.5">
                <Info className="size-3.5" /> Clinical decision support
              </Badge>
            </div>

            <PgxEvaluator drugs={drugs} hints={GENE_HINTS} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
