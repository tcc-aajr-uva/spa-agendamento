export type EstadoAcessoUsuario =
  | "ATIVO"
  | "INATIVO"
  | "CONVITE_PENDENTE"
  | "CONVITE_EXPIRADO"
  | "CONVITE_REVOGADO"
  | "SEM_CONVITE";

type UsuarioComAcesso = {
  ativo: boolean;
  accounts: { id: string }[];
  convites: { expiraEm: Date; usadoEm: Date | null; revogadoEm: Date | null }[];
};

export function determinarEstadoAcesso(usuario: UsuarioComAcesso, agora: Date): EstadoAcessoUsuario {
  if (!usuario.ativo) return "INATIVO";
  if (usuario.accounts.length > 0) return "ATIVO";

  const convite = usuario.convites[0];
  if (!convite) return "SEM_CONVITE";
  if (convite.revogadoEm !== null) return "CONVITE_REVOGADO";
  if (convite.usadoEm !== null) return "SEM_CONVITE";
  if (convite.expiraEm <= agora) return "CONVITE_EXPIRADO";
  return "CONVITE_PENDENTE";
}
