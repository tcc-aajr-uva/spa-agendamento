import { buscarPaciente } from "./actions";
import { FichaPaciente } from "./ficha-paciente";

export default async function Pagina({ searchParams }: { searchParams: Promise<{ cpf: string }> }) {
  const { cpf } = await searchParams;
  const paciente = await buscarPaciente(cpf);
  if (!paciente) return null;
  return <FichaPaciente paciente={paciente} />;
}
