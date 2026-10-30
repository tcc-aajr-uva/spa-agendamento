"use client";

import type { Paciente } from "@/generated/prisma/client";

export function FichaPaciente({ paciente }: { paciente: Paciente }) {
  return (
    <div>
      <p>{paciente.nome}</p>
      <p>{paciente.cpf}</p>
    </div>
  );
}
