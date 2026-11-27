import { useState } from "react";
import { router } from "@inertiajs/react";
import { ChevronRight, CreditCard, Edit3, Home, Mail, Phone, Trash2, UserRound } from "lucide-react";
import { Avatar, BackButton, Card, Pill } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { FONT_DISPLAY, T } from "../../styles/theme";
import { confirmar } from "../../utils/alertas";
import { navigate } from "../../utils/nav";
import InfoRow from "../Pacientes/components/InfoRow";
import ProfileActionButton from "../Pacientes/components/ProfileActionButton";
import GuardianModal from "./components/GuardianModal";

const tom = (status) => (status === "Ativo" ? "success" : status === "Bloqueado" ? "danger" : "muted");

export default function ResponsavelProfile({ guardian }) {
  const { deleteGuardian } = useAppData();
  const [editing, setEditing] = useState(false);

  async function excluir() {
    const ok = await confirmar({
      titulo: "Excluir responsável?",
      texto: `O cadastro de ${guardian.name} será excluído e os pacientes ligados a ele ficarão sem responsável.`,
      confirmar: "Excluir",
      perigo: true,
    });
    if (ok) deleteGuardian(guardian.id);
  }

  return (
    <div>
      <BackButton onClick={() => navigate("responsaveis")}>Voltar para responsáveis</BackButton>

      <Card style={{ padding: "26px 32px", marginBottom: 20, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <Avatar initials={guardian.initials} color={guardian.color} size={92} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, color: T.text }}>{guardian.name}</div>
          <div style={{ fontSize: 14.5, color: T.muted, marginTop: 6 }}>
            Responsável por {guardian.dependentes} {guardian.dependentes === 1 ? "paciente" : "pacientes"}
            {guardian.cadastro ? ` · cadastrado em ${guardian.cadastro}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ProfileActionButton icon={Edit3} onClick={() => setEditing(true)}>Editar</ProfileActionButton>
          <button onClick={excluir} title="Excluir responsável" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.danger, fontWeight: 600, cursor: "pointer" }}>
            <Trash2 size={17} /> Excluir
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Card style={{ padding: "8px 28px" }}>
          <InfoRow icon={CreditCard} label="CPF" value={guardian.cpf} />
          <InfoRow icon={Phone} label="Telefone" value={guardian.phone} />
          <InfoRow icon={Mail} label="E-mail" value={guardian.email} />
          <InfoRow icon={Home} label="Endereço" value={guardian.endereco} />
          <div style={{ padding: "16px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Observações</div>
            <div style={{ fontSize: 15, color: T.text, lineHeight: 1.6 }}>{guardian.observacoes || "Nenhuma observação registrada."}</div>
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 12 }}>Pacientes sob responsabilidade</div>
          {guardian.pacientes.length === 0 && (
            <div style={{ fontSize: 13.5, color: T.muted, padding: "18px 0", textAlign: "center" }}>
              <UserRound size={28} style={{ opacity: 0.45 }} />
              <div style={{ marginTop: 6 }}>Nenhum paciente ligado a este responsável.</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {guardian.pacientes.map((p) => (
              <button
                key={p.id}
                onClick={() => router.visit(`/pacientes/${p.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, cursor: "pointer", textAlign: "left", color: T.text }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.surface)}
              >
                <Avatar initials={p.initials} color={p.color} src={p.photo} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: T.muted }}>
                    {[p.parentesco, p.idade != null ? `${p.idade} anos` : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Pill tone={tom(p.status)}>{p.status}</Pill>
                <ChevronRight size={18} color={T.muted} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {editing && <GuardianModal editing={guardian} onClose={() => setEditing(false)} />}
    </div>
  );
}
