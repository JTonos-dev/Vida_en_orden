"use client";

import type { ChangeEvent } from "react";
import type { FinanceConcept } from "@/lib/app-types";

export function ConceptInput({ concepts, name, value, onChange, required = false, placeholder = "Ej. Supermercado, salario, transferencia…" }: {
  concepts: FinanceConcept[];
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const listId = `finance-concepts-${name}`;
  return <label>Concepto{required ? "*" : ""}<input name={name} required={required} list={listId} value={value} onChange={onChange} placeholder={placeholder} autoComplete="off" /><datalist id={listId}>{concepts.map((item) => <option value={item.concept} key={item.id} />)}</datalist></label>;
}
