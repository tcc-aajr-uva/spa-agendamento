"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dadosPacienteSchema } from "@/lib/paciente/dados-paciente";
import type { EstadoInscricao } from "./actions";

type Props = {
  acao: (estado: EstadoInscricao, formData: FormData) => Promise<EstadoInscricao>;
  rotuloBotao: string;
  camposOcultos: Record<string, string>;
};

const CAMPOS = [
  { nome: "nome", rotulo: "Nome completo", tipo: "text" },
  { nome: "cpf", rotulo: "CPF", tipo: "text" },
  { nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date" },
  { nome: "telefone", rotulo: "Telefone com DDD", tipo: "tel" },
  { nome: "email", rotulo: "E-mail", tipo: "email" },
  { nome: "responsavelNome", rotulo: "Nome do responsável legal (menor de idade)", tipo: "text" },
  { nome: "responsavelCpf", rotulo: "CPF do responsável legal (menor de idade)", tipo: "text" },
] as const;

export function FormularioPaciente({ acao, rotuloBotao, camposOcultos }: Props) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(dadosPacienteSchema) });

  const aoEnviar = handleSubmit((_dados, evento) => {
    const formData = new FormData(evento?.target as HTMLFormElement);
    startTransition(() => enviar(formData));
  });

  if (estado.mensagem) {
    return (
      <section className="flex flex-col gap-2 rounded border p-4">
        <p>{estado.mensagem}</p>
        {estado.codigo && (
          <p>
            Seu código: <strong>{estado.codigo}</strong>
          </p>
        )}
        {estado.linkCancelamento && (
          <p>
            Para cancelar, guarde este link: <Link className="underline" href={estado.linkCancelamento}>cancelar agendamento</Link>
          </p>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-3">
      {Object.entries(camposOcultos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      {CAMPOS.map((campo) => (
        <label key={campo.nome} className="flex flex-col gap-1">
          {campo.rotulo}
          <input {...register(campo.nome)} type={campo.tipo} className="rounded border bg-transparent px-2 py-1" />
          {errors[campo.nome] && <span className="text-sm text-red-400">{errors[campo.nome]?.message}</span>}
        </label>
      ))}
      {estado.erro && <p className="text-red-400" aria-live="polite">{estado.erro}</p>}
      <button disabled={enviando} className="rounded border px-3 py-2">
        {enviando ? "Enviando…" : rotuloBotao}
      </button>
    </form>
  );
}
