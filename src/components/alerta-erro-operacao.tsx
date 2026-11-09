import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  titulo: string;
  mensagem: string;
};

export function AlertaErroOperacao({ titulo, mensagem }: Props) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}
