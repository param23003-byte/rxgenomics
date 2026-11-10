import { LikertForm } from "@/components/study/likert-form";
import { TAM_ITEMS, TAM_OPEN_QUESTIONS } from "@/lib/study/tam";

export default async function TamPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  return (
    <LikertForm
      title="Acceptability questionnaire"
      description="A few questions about how useful and usable you found RxGenomics, and whether you would use it."
      items={TAM_ITEMS.map((i) => ({ id: i.id, text: i.text }))}
      instrument="TAM"
      sessionId={sessionId}
      nextHref={`/study/${sessionId}/done`}
      openQuestions={TAM_OPEN_QUESTIONS}
    />
  );
}
