import { useState } from "react";
import { ChevronDown, ChevronUp, Edit3, HeartPulse, Plus, Trash2 } from "lucide-react";
import { Card, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { FONT_DISPLAY, T } from "../../../styles/theme";
import AnamneseForm from "../components/AnamneseForm";

const ghostBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontWeight: 600, cursor: "pointer", fontSize: 13.5 };

/* Um paciente pode ter várias anamneses: cada uma é criada, editada e excluída sozinha. */
export default function AnamneseTab({ patient, anamnese }) {
  const { saveAnamnese, deleteAnamnese } = useAppData();
  const { secoes, lista } = anamnese;
  const [editingId, setEditingId] = useState(null); // null | "new" | id da anamnese
  const [confirmId, setConfirmId] = useState(null);
  const [abertas, setAbertas] = useState(() => new Set(lista.length ? [lista[0].id] : []));

  function alternar(id) {
    setAbertas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function handleSave(form) {
    const dados = editingId === "new" ? form : { ...form, id: editingId };
    saveAnamnese(patient.id, dados, { onSuccess: () => setEditingId(null) });
  }

  if (editingId !== null) {
    const atual = editingId === "new" ? null : lista.find((a) => a.id === editingId);
    return (
      <AnamneseForm
        secoes={secoes}
        initial={atual || { titulo: "", respostas: {} }}
        editando={Boolean(atual)}
        onCancel={() => setEditingId(null)}
        onSave={handleSave}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {lista.length} {lista.length === 1 ? "anamnese" : "anamneses"}
        </div>
        <PrimaryButton icon={Plus} style={{ padding: "12px 18px", fontSize: 14.5 }} onClick={() => setEditingId("new")}>Nova anamnese</PrimaryButton>
      </div>

      {lista.length === 0 ? (
        <Card style={{ padding: 34, textAlign: "center" }}>
          <HeartPulse size={34} color={T.muted} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: 15.5, color: T.muted, marginTop: 10 }}>Nenhuma anamnese registrada ainda para este paciente.</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {lista.map((a, i) => {
            const aberta = abertas.has(a.id);
            const secoesPreenchidas = secoes
              .map((s) => ({ ...s, fields: s.fields.filter((f) => a.respostas[f.key]) }))
              .filter((s) => s.fields.length > 0);
            const total = Object.keys(a.respostas).length;
            return (
              <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => alternar(a.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: T.primaryTint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <HeartPulse size={21} color={T.primary} />
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, fontWeight: 600, color: T.text }}>
                        {a.titulo || `Anamnese ${lista.length - i}`}
                      </div>
                      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                        Criada em {a.criadoEm}{a.atualizadoEm !== a.criadoEm ? ` · editada em ${a.atualizadoEm}` : ""} · {total} {total === 1 ? "resposta" : "respostas"}
                      </div>
                    </div>
                    <span style={{ marginLeft: "auto", color: T.muted, display: "flex" }}>{aberta ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingId(a.id)} style={ghostBtn}><Edit3 size={16} /> Editar</button>
                    <button onClick={() => setConfirmId(a.id)} style={{ ...ghostBtn, color: T.danger }}><Trash2 size={16} /> Excluir</button>
                  </div>
                </div>

                {confirmId === a.id && (
                  <div style={{ margin: "0 20px 16px", background: T.dangerTint, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Excluir esta anamnese?</div>
                    <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>As respostas dela serão apagadas. As outras anamneses do paciente continuam. Não dá para desfazer.</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      <button onClick={() => setConfirmId(null)} style={ghostBtn}>Cancelar</button>
                      <button
                        onClick={() => deleteAnamnese(a.id, { onSuccess: () => setConfirmId(null) })}
                        style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: T.danger, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
                      >
                        Excluir anamnese
                      </button>
                    </div>
                  </div>
                )}

                {aberta && (
                  <div style={{ padding: "4px 24px 22px", borderTop: `1px solid ${T.border}` }}>
                    {secoesPreenchidas.map((section) => (
                      <div key={section.title} style={{ marginTop: 18 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>{section.title}</div>
                        {section.fields.map((f) => (
                          <div key={f.key} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.respostas[f.key]}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
