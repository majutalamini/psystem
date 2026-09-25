import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { blankRecordForm } from "../../components/prontuario/blankRecordForm";
import RecordCard from "../../components/prontuario/RecordCard";
import RecordForm from "../../components/prontuario/RecordForm";
import { Avatar, Card, PageHeader, Pill, PrimaryButton, SearchInput } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { T } from "../../styles/theme";

export default function Prontuarios() {
  const { patients, records, saveRecord } = useAppData();
  const [selected, setSelected] = useState(patients[0].id);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null); // null | "new" | entry id

  const active = patients.find((p) => p.id === selected);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const history = records[selected] || [];

  function handleSave(form) {
    const id = editingId === "new" ? Date.now() : editingId;
    saveRecord(selected, { ...form, id });
    setEditingId(null);
  }

  return (
    <div>
      <PageHeader
        title="Prontuários"
        subtitle="Histórico clínico e evolução dos pacientes"
        action={<PrimaryButton icon={Plus} style={{ padding: "12px 18px", fontSize: 15 }} onClick={() => setEditingId("new")}>Novo prontuário</PrimaryButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 26, alignItems: "start" }}>
        <Card style={{ padding: 16, position: "sticky", top: 0 }}>
          <div style={{ padding: "2px 4px 14px" }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente..." />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "calc(100vh - 320px)", minHeight: 280, overflowY: "auto" }}>
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelected(p.id); setEditingId(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 13, padding: "13px 12px", borderRadius: 12, border: "none",
                  background: selected === p.id ? T.primaryTint : "transparent", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => { if (selected !== p.id) e.currentTarget.style.background = "#F5F6FA"; }}
                onMouseLeave={(e) => { if (selected !== p.id) e.currentTarget.style.background = "transparent"; }}
              >
                <Avatar initials={p.initials} color={p.color} src={p.photo} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: selected === p.id ? 700 : 600, color: selected === p.id ? T.primaryDark : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{(records[p.id] || []).length} registros</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div>
          <Card style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, padding: "18px 22px", flexWrap: "wrap" }}>
            <Avatar initials={active.initials} color={active.color} src={active.photo} size={66} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 23, color: T.text }}>{active.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: T.muted, marginTop: 4 }}>
                {active.sessions} sessões · <Pill tone={active.status === "Ativo" ? "success" : "muted"}>{active.status}</Pill>
              </div>
            </div>
            {editingId === null && (
              <PrimaryButton icon={Plus} style={{ padding: "12px 18px", fontSize: 14.5 }} onClick={() => setEditingId("new")}>Novo registro</PrimaryButton>
            )}
          </Card>

          {editingId !== null ? (
            <RecordForm
              initial={editingId === "new" ? blankRecordForm() : history.find((r) => r.id === editingId)}
              onCancel={() => setEditingId(null)}
              onSave={handleSave}
            />
          ) : history.length === 0 ? (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <ClipboardList size={38} color={T.muted} style={{ opacity: 0.5 }} />
              <div style={{ fontSize: 16, color: T.muted, marginTop: 12 }}>Nenhum registro no prontuário ainda para este paciente.</div>
            </Card>
          ) : (
            history.map((entry) => (
              <RecordCard key={entry.id} entry={entry} onEdit={() => setEditingId(entry.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
