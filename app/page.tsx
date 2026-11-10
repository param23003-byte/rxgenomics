import Link from "next/link";
import { ArrowRight, Dna, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground md:px-10 md:py-24">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dna className="size-6" aria-hidden="true" />
        </div>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-primary">RxGenomics</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
          Pharmacogenomic decision support, grounded in CPIC guidance.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          RxGenomics translates a reported genotype into a clear drug-gene recommendation using a verified CPIC knowledge base. It is designed to help researchers and clinicians review pharmacogenomic evidence without patient data.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/interactions">
              Open the evaluator <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" /> Research prototype. Not for clinical use.
          </span>
        </div>
      </div>
    </main>
  );
}
