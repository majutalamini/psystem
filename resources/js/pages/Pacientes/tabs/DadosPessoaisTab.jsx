import { Cake, CreditCard, Home, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { Card } from "../../../components/ui";
import { T } from "../../../styles/theme";
import InfoRow from "../components/InfoRow";

export default function DadosPessoaisTab({ patient }) {
  return (
    <Card style={{ padding: "8px 28px" }}>
      <InfoRow icon={Cake} label="Data de nascimento" value={patient.nascimento} />
      <InfoRow icon={CreditCard} label="CPF" value={patient.cpf} />
      <InfoRow icon={Phone} label="Telefone" value={patient.phone} />
      <InfoRow icon={Mail} label="E-mail" value={patient.email} />
      <InfoRow icon={Home} label="Endereço" value={patient.endereco} />
      <InfoRow icon={ShieldCheck} label="Convênio" value={patient.convenio} />
      <InfoRow icon={User} label="Contato de emergência" value={patient.emergenciaNome && patient.emergenciaTelefone ? `${patient.emergenciaNome} · ${patient.emergenciaTelefone}` : patient.emergenciaNome} />
      <div style={{ padding: "16px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Observações</div>
        <div style={{ fontSize: 15.5, color: T.text, lineHeight: 1.7 }}>{patient.observacoes || "Nenhuma observação registrada."}</div>
      </div>
    </Card>
  );
}
