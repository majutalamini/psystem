import { useState } from "react";
import { router } from "@inertiajs/react";
import { FileUp, HeartPulse } from "lucide-react";
import { Avatar, Card, PageHeader, Pill, PrimaryButton, SearchInput } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { FONT_DISPLAY, T } from "../../styles/theme";
import AnamneseTab from "../Pacientes/tabs/AnamneseTab";

/* Mesma ideia da tela de Prontuários: pacientes à esquerda e, à direita, a anamnese do escolhido (?paciente=id). */
export default function Anamneses({ selectedId, anamnese, anamneseCounts }) {
  const { patients } = useAppData();
  const [query, setQuery] = useState("");

  const active = patients.find((p) => p.id === selectedId);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  function selectPatient(id) {
    router.get("/anamneses", { paciente: id }, { preserveState: true, preserveScroll: true });
  }

  if (!active) {
    return (
      <div>
        <PageHeader title="Anamneses" subtitle="Acolhimento e histórico de cada paciente" />
        <Card style={{ padding: 40, textAlign: "center" }}>
          <HeartPulse size={38} color={T.muted} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 16, color: T.muted, marginTop: 12 }}>Cadastre um paciente para começar a registrar anamneses.</div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Anamneses"
        subtitle="Acolhimento e histórico de cada paciente"
        action={<PrimaryButton icon={FileUp} style={{ padding: "12px 18px", fontSize: 15 }} onClick={() => router.visit(`/importacoes?tipo=anamnese&paciente=${active.id}`)}>Importar de .docx</PrimaryButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 26, alignItems: "start" }}>
        <Card style={{ padding: 16, position: "sticky", top: 0 }}>
          <div style={{ padding: "2px 4px 14px" }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "calc(100vh - 320px)", minHeight: 280, overflowY: "auto" }}>
            {filtered.map((p) => {
              const total = anamneseCounts[p.id] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 13, padding: "13px 12px", borderRadius: 12, border: "none",
                    background: selectedId === p.id ? T.primaryTint : "transparent", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (selectedId !== p.id) e.currentTarget.style.background = T.hover; }}
                  onMouseLeave={(e) => { if (selectedId !== p.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar initials={p.initials} color={p.color} src={p.photo} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: selectedId === p.id ? 700 : 600, color: selectedId === p.id ? T.primaryDark : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: total > 0 ? T.success : T.muted, marginTop: 2 }}>{total === 0 ? "Sem anamnese" : total === 1 ? "1 anamnese" : `${total} anamneses`}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div>
          <Card style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, padding: "18px 22px", flexWrap: "wrap" }}>
            <Avatar initials={active.initials} color={active.color} src={active.photo} size={66} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 23, color: T.text }}>{active.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: T.muted, marginTop: 4 }}>
                {active.sessions} sessões · <Pill tone={active.status === "Ativo" ? "success" : "muted"}>{active.status}</Pill>
              </div>
            </div>
          </Card>

          <AnamneseTab key={`${active.id}-${anamnese.lista.map((a) => a.id).join("-")}`} patient={active} anamnese={anamnese} />
        </div>
      </div>
    </div>
  );
}
