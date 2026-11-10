import { CircleCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DonePage() {
  return (
    <Card>
      <CardHeader>
        <CircleCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
        <CardTitle>Session complete</CardTitle>
        <CardDescription>Thank you for taking part.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>Your answers have been recorded against your participant ID. No personal details were stored.</p>
        <p>Please hand the device back to the facilitator.</p>
      </CardContent>
    </Card>
  );
}
