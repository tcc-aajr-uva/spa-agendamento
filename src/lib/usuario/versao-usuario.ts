import "server-only";

import { ErroDeRegra } from "@/lib/erros";

export class VersaoDesatualizadaDoUsuario extends ErroDeRegra {
  constructor() {
    super("CONFLITO_CONCORRENTE", "O usuário foi alterado em outra sessão.");
  }
}
