import type { Perfil } from "@/generated/prisma/client";
import type { EstadoAcessoUsuario } from "@/lib/usuario/estado-acesso";

const ROTULOS_PERFIL: Record<Perfil, string> = {
  ADMINISTRADOR: "Administrador",
  COORDENACAO: "Coordenação",
  SECRETARIA: "Secretaria",
  SUPERVISOR: "Supervisor",
  ESTAGIARIO: "Estagiário",
};

export function rotuloDoPerfil(perfil: Perfil): string {
  return ROTULOS_PERFIL[perfil];
}

const ROTULOS_ESTADO_ACESSO: Record<EstadoAcessoUsuario, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  CONVITE_PENDENTE: "Convite pendente",
  CONVITE_EXPIRADO: "Convite expirado",
  CONVITE_REVOGADO: "Convite revogado",
  SEM_CONVITE: "Sem convite",
};

export function rotuloDoEstadoAcesso(estado: EstadoAcessoUsuario): string {
  return ROTULOS_ESTADO_ACESSO[estado];
}
