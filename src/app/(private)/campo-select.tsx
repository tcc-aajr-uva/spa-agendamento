import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type OpcaoSelect = { value: string | null; label: string };

type Props = {
  id: string;
  nome: string;
  rotulo: string;
  opcoes: OpcaoSelect[];
  valor?: string;
  obrigatorio?: boolean;
  className?: string;
};

export function CampoSelect({ id, nome, rotulo, opcoes, valor, obrigatorio, className }: Props) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Select name={nome} defaultValue={valor ?? opcoes[0]?.value ?? null} items={opcoes} required={obrigatorio}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao.value ?? "todos"} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
