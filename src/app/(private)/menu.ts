import type { Perfil } from "@/generated/prisma/client";

export type ItemMenu = {
  href: string;
  rotulo: string;
  card: string;
  perfis: Perfil[];
  filhos?: Omit<ItemMenu, "card" | "filhos">[];
};

export const MENU: ItemMenu[] = [
  { href: "/inicio", rotulo: "Início", card: "esqueleto", perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR", "ESTAGIARIO"] },
  {
    href: "/cadastros",
    rotulo: "Cadastros",
    card: "#1",
    perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR"],
    filhos: [
      {
        href: "/cadastros/usuarios",
        rotulo: "Usuários",
        perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "SUPERVISOR"],
      },
    ],
  },
  { href: "/salas", rotulo: "Salas", card: "#2", perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA"] },
  { href: "/agenda", rotulo: "Minha agenda", card: "#2", perfis: ["ADMINISTRADOR", "ESTAGIARIO"] },
  { href: "/reservas", rotulo: "Minhas reservas", card: "#2", perfis: ["ADMINISTRADOR", "ESTAGIARIO"] },
  { href: "/pacientes", rotulo: "Meus pacientes", card: "#3", perfis: ["ADMINISTRADOR", "ESTAGIARIO"] },
  { href: "/lista-espera", rotulo: "Lista de espera", card: "#3", perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA", "ESTAGIARIO"] },
  { href: "/painel", rotulo: "Painel", card: "#4", perfis: ["ADMINISTRADOR", "COORDENACAO", "SECRETARIA"] },
];

export function perfisDaRota(href: string): Perfil[] {
  for (const item of MENU) {
    if (item.href === href) return item.perfis;
    const filho = item.filhos?.find((candidato) => candidato.href === href);
    if (filho) return filho.perfis;
  }
  return [];
}
