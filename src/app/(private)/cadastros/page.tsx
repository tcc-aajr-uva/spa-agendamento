import { Suspense } from "react";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { perfisDaRota } from "../menu";
import { IndicadorCarregando } from "@/components/indicador-carregando";

export default function CadastrosPage() {
  return (
    <Suspense fallback={<IndicadorCarregando />}>
      <RedirecionarParaUsuarios />
    </Suspense>
  );
}

async function RedirecionarParaUsuarios() {
  await exigirUsuario(perfisDaRota("/cadastros"));
  return redirect("/cadastros/usuarios");
}
