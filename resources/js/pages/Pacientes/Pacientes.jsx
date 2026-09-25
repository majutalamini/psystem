import { useState } from "react";
import { router } from "@inertiajs/react";
import { ChevronLeft, ChevronRight, ExternalLink, Mail, MoreVertical, Phone, Plus, SlidersHorizontal } from "lucide-react";
import { Avatar, Card, Pill, PrimaryButton, SearchInput } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { iconBtn } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import NewPatientModal from "./components/NewPatientModal";

export default function Pacientes() {
  const { patients, addPatient } = useAppData();
  const [query, setQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const openPatient = (id) => router.visit(`/pacientes/${id}`);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Pacientes</h1>
          <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar" />
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff", fontWeight: 700, fontSize: 13.5, color: T.text, cursor: "pointer" }}>
            <SlidersHorizontal size={20} /> FILTROS
          </button>
          <PrimaryButton icon={Plus} onClick={() => setShowNewModal(true)}>NOVO PACIENTE</PrimaryButton>
        </div>
      </div>

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFBFE", textAlign: "left" }}>
              {["Paciente", "Contato", "Sessões", "Última sessão", "Próxima sessão", "Situação", ""].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => openPatient(p.id)}
                style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFE")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar initials={p.initials} color={p.color} src={p.photo} size={40} />
                    <span style={{ fontWeight: 600, fontSize: 14.5, color: T.text }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: T.muted }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><Phone size={16} /> {p.phone}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={16} /> {p.email}</div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 14, color: T.text, fontWeight: 600 }}>{p.sessions}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.lastSession}</td>
                <td style={{ padding: "14px 20px", fontSize: 13.5, color: T.text }}>{p.nextSession}</td>
                <td style={{ padding: "14px 20px" }}>
                  <Pill tone={p.status === "Ativo" ? "success" : "muted"}>{p.status}</Pill>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
                    <button onClick={() => openPatient(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }} title="Abrir paciente">
                      <ExternalLink size={18} />
                    </button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}>
                      <MoreVertical size={19} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Página <strong style={{ color: T.text }}>1</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span>{filtered.length === 0 ? "0" : `1–${filtered.length}`} de {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled style={{ ...iconBtn, background: "#fff", opacity: 0.4, cursor: "default" }}><ChevronLeft size={19} /></button>
              <button disabled style={{ ...iconBtn, background: "#fff", opacity: 0.4, cursor: "default" }}><ChevronRight size={19} /></button>
            </div>
          </div>
        </div>
      </Card>

      {showNewModal && (
        <NewPatientModal
          onClose={() => setShowNewModal(false)}
          onSave={(form) => addPatient(form)}
        />
      )}
    </div>
  );
}
