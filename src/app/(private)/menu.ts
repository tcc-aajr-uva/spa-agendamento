import type { Perfil } from "@/generated/prisma/client";

export type ItemMenu = {
  href: string;
  rotulo: string;
  card: string;
  perfis: Perfil[];
};

export const MENU: ItemMenu[] = [
  { href: "/inicio", rotulo: "Início", card: "esqueleto", perfis: ["COORDENACAO", "SECRETARIA", "SUPERVISOR", "ESTAGIARIO"] },
  { href: "/cadastros", rotulo: "Cadastros", card: "#1", perfis: ["COORDENACAO", "SECRETARIA", "SUPERVISOR"] },
  { href: "/salas", rotulo: "Salas", card: "#2", perfis: ["COORDENACAO", "SECRETARIA"] },
  { href: "/agenda", rotulo: "Minha agenda", card: "#2", perfis: ["ESTAGIARIO"] },
  { href: "/reservas", rotulo: "Minhas reservas", card: "#2", perfis: ["ESTAGIARIO"] },
  { href: "/pacientes", rotulo: "Pacientes", card: "#3", perfis: ["ESTAGIARIO", "SECRETARIA", "COORDENACAO"] },
  { href: "/lista-espera", rotulo: "Lista de espera", card: "#3", perfis: ["COORDENACAO", "SECRETARIA", "ESTAGIARIO"] },
  { href: "/painel", rotulo: "Painel", card: "#4", perfis: ["COORDENACAO", "SECRETARIA"] },
];

export function perfisDaRota(href: string): Perfil[] {
  return MENU.find((item) => item.href === href)?.perfis ?? [];
}
