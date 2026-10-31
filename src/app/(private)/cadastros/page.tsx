import { Suspense } from "react";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/lib/auth/autorizacao";
import { perfisDaRota } from "../menu";

export default function CadastrosPage() {
  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <RedirecionarParaUsuarios />
    </Suspense>
  );
}

async function RedirecionarParaUsuarios() {
  await exigirUsuario(perfisDaRota("/cadastros"));
  redirect("/cadastros/usuarios");
  return null;
}
