import { useState } from "react";
import { router } from "@inertiajs/react";
import { CalendarClock, Edit3, ExternalLink, FolderOpen, Mail, Phone, Plus, SlidersHorizontal, Trash2, UserX, X } from "lucide-react";
import { Avatar, Card, Pagination, Pill, PrimaryButton, RowMenu, SearchInput } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { filterInputStyle, iconBtn } from "../../styles/formStyles";
import { T } from "../../styles/theme";
import { confirmar } from "../../utils/alertas";
import NewPatientModal from "./components/NewPatientModal";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const SEM_FILTROS = { situacao: "", matricula: "", dia: "", modalidade: "", cobranca: "" };

export default function Pacientes({ patientDirectory }) {
  const { addPatient, deletePatient, inactivatePatient } = useAppData();
  const { patients: visible, pagination } = patientDirectory;
  const [query, setQuery] = useState(patientDirectory.q);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(patientDirectory.filters);
  const activeFilters = Object.values(filters).filter(value => value !== "" && value !== null).length;

  function visit(text, nextFilters, page = 1, replace = true) {
    router.get("/pacientes", { q: text, ...nextFilters, page }, { preserveState: true, preserveScroll: true, replace });
  }
  function search(text) { setQuery(text); visit(text, filters); }
  const setFilter = key => event => {
    const next = { ...filters, [key]: event.target.value };
    setFilters(next);
    visit(query, next);
  };
  function clearFilters() { setFilters(SEM_FILTROS); visit(query, SEM_FILTROS); }
  const openPatient = id => router.visit(`/pacientes/${id}`);

  /* Só é possível excluir cadastro sem histórico (o servidor confere); com histórico, o caminho é inativar. */
  async function excluir(p) {
    const ok = await confirmar({
      titulo: "Excluir cadastro?",
      texto: `Você vai excluir o cadastro de ${p.name}. Isso só é possível se ele não tiver atendimento realizado, prontuário, anamnese, documento ou cobrança; nesse caso, use "Inativar". Essa ação não pode ser desfeita.`,
      confirmar: "Excluir cadastro",
      perigo: true,
    });
    if (ok) deletePatient(p.id);
  }

  async function inativar(p) {
    const ok = await confirmar({
      titulo: "Inativar paciente?",
      texto: `As matrículas de ${p.name} serão encerradas e todas as consultas futuras saem da agenda. Sessões passadas, prontuários, anamneses, documentos e cobranças continuam. Reativar (nova matrícula) não restaura o que foi apagado.`,
      confirmar: "Inativar",
      perigo: true,
    });
    if (ok) inactivatePatient(p.id);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Pacientes</h1>
          <SearchInput value={query} onChange={search} placeholder="Pesquisar" />
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
            <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 9, border: "none", background: "none", color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
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
                      ...(p.status === "Ativo" ? [{ label: "Inativar", icon: UserX, tone: "danger", onClick: () => inativar(p) }] : []),
                      { label: "Excluir cadastro", icon: Trash2, tone: "danger", onClick: () => excluir(p) },
                    ]} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination pagination={pagination} onPage={number => visit(query, filters, number, false)} label="pacientes" />
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
