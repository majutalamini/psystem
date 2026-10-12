import { useState } from "react";
import { router } from "@inertiajs/react";
import { CalendarClock, ChevronLeft, ChevronRight, Edit3, ExternalLink, FolderOpen, Mail, Phone, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Avatar, Card, Modal, Pill, PrimaryButton, RowMenu, SearchInput } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { filterInputStyle, iconBtn } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { matriculasAtivas } from "../../utils/matricula";
import NewPatientModal from "./components/NewPatientModal";

const PAGE_SIZE = 10;
const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const SEM_FILTROS = { situacao: "", matricula: "", dia: "", modalidade: "", cobranca: "" };

export default function Pacientes() {
  const { patients, addPatient, deletePatient } = useAppData();
  const [query, setQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filters, setFilters] = useState(SEM_FILTROS);
  const [page, setPage] = useState(1);
  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); };
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const filtered = patients.filter((p) => {
    if (!p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (filters.situacao && p.status !== filters.situacao) return false;
    const mats = matriculasAtivas(p);
    if (filters.matricula === "com" && mats.length === 0) return false;
    if (filters.matricula === "sem" && mats.length > 0) return false;
    if (filters.dia !== "" && !mats.some((m) => m.weekday === Number(filters.dia))) return false;
    if (filters.modalidade && !mats.some((m) => m.tipo === filters.modalidade)) return false;
    if (filters.cobranca === "pendente" && !p.cobrancaPendente) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const openPatient = (id) => router.visit(`/pacientes/${id}`);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Pacientes</h1>
          <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Pesquisar" />
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: `1px solid ${showFilters || activeFilters ? T.primary : T.border}`, background: showFilters ? T.primaryTint : T.surface, fontWeight: 700, fontSize: 13.5, color: T.text, cursor: "pointer" }}
          >
            <SlidersHorizontal size={20} /> FILTROS{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <PrimaryButton icon={Plus} onClick={() => setShowNewModal(true)}>NOVO PACIENTE</PrimaryButton>
        </div>
      </div>

      {showFilters && (
        <Card style={{ padding: 18, marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { key: "situacao", label: "Situação", options: [["", "Todas"], ["Ativo", "Ativo"], ["Inativo", "Inativo"]] },
            { key: "matricula", label: "Matrícula", options: [["", "Todas"], ["com", "Com matrícula"], ["sem", "Sem matrícula"]] },
            { key: "dia", label: "Dia da semana", options: [["", "Todos"], ...DIAS.map((d, i) => [String(i), d])] },
            { key: "modalidade", label: "Modalidade", options: [["", "Todas"], ["Consulta presencial", "Presencial"], ["Consulta online", "Online"]] },
            { key: "cobranca", label: "Cobrança", options: [["", "Todas"], ["pendente", "Com cobrança pendente"]] },
          ].map((f) => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12.5, fontWeight: 600, color: T.muted }}>
              {f.label}
              <select value={filters[f.key]} onChange={setFilter(f.key)} style={filterInputStyle}>
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          ))}
          {activeFilters > 0 && (
            <button onClick={() => { setFilters(SEM_FILTROS); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              <X size={16} /> Limpar filtros
            </button>
          )}
        </Card>
      )}

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
              {["Paciente", "Contato", "Sessões", "Última sessão", "Próxima sessão", "Situação", ""].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr
                key={p.id}
                onClick={() => openPatient(p.id)}
                style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceAlt)}
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
                    <a href={`/pacientes/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: T.muted, display: "flex" }} title="Abrir em nova guia">
                      <ExternalLink size={18} />
                    </a>
                    <RowMenu items={[
                      { label: "Abrir", icon: FolderOpen, onClick: () => openPatient(p.id) },
                      { label: "Editar cadastro", icon: Edit3, onClick: () => router.visit(`/pacientes/${p.id}?editar=1`) },
                      { label: "Nova matrícula", icon: CalendarClock, onClick: () => router.visit(`/pacientes/${p.id}?aba=matricula`) },
                      { label: "Excluir cadastro", icon: Trash2, tone: "danger", onClick: () => setToDelete(p) },
                    ]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${T.border}`, fontSize: 13, color: T.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Página <strong style={{ color: T.text }}>{current}</strong> de {totalPages}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span>{filtered.length === 0 ? "0" : `${start + 1}–${start + visible.length}`} de {filtered.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button disabled={current <= 1} onClick={() => setPage(current - 1)} style={{ ...iconBtn, background: T.surface, opacity: current <= 1 ? 0.4 : 1, cursor: current <= 1 ? "default" : "pointer" }}><ChevronLeft size={19} /></button>
              <button disabled={current >= totalPages} onClick={() => setPage(current + 1)} style={{ ...iconBtn, background: T.surface, opacity: current >= totalPages ? 0.4 : 1, cursor: current >= totalPages ? "default" : "pointer" }}><ChevronRight size={19} /></button>
            </div>
          </div>
        </div>
      </Card>

      {toDelete && (
        <Modal title="Excluir cadastro?" onClose={() => setToDelete(null)} width={440}>
          <p style={{ fontSize: 14, color: T.text, lineHeight: 1.6, margin: "0 0 8px" }}>
            Você vai excluir o cadastro de <strong>{toDelete.name}</strong>.
          </p>
          <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6, margin: "0 0 20px" }}>
            Matrícula, consultas, prontuários, anamnese, documentos e cobranças deste paciente também serão apagados. Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setToDelete(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button
              onClick={() => deletePatient(toDelete.id, { onSuccess: () => setToDelete(null) })}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: T.danger, color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Excluir cadastro
            </button>
          </div>
        </Modal>
      )}

      {showNewModal && (
        <NewPatientModal
          onClose={() => setShowNewModal(false)}
          onSave={(form) => addPatient(form)}
        />
      )}
    </div>
  );
}
