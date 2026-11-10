import { LikertForm } from "@/components/study/likert-form";
import { SUS_ITEMS } from "@/lib/study/sus";

export default async function SusPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const items = SUS_ITEMS.map((text, i) => ({ id: `SUS${i + 1}`, text }));

  return (
    <LikertForm
      title="System Usability Scale"
      description="Thinking about the session you have just completed, say how much you agree with each statement. Answer quickly and with your first impression; there are no right answers."
      items={items}
      instrument="SUS"
      sessionId={sessionId}
      nextHref={`/study/${sessionId}/tam`}
    />
  );
}
