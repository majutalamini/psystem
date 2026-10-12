import { useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { Check, FileText, FileUp, HeartPulse, Upload } from "lucide-react";
import { Card, ErrorText, FormField, PageHeader, PrimaryButton } from "../../components/ui";
import { useAppData } from "../../hooks/useAppData";
import { inputStyle } from "../../styles/formStyles";
import { FONT_DISPLAY, T } from "../../styles/theme";
import { lerAnamnese, lerDocx, lerProntuario } from "../../utils/docx";

const TIPOS = [
  { key: "prontuario", label: "Prontuário", icon: FileText },
  { key: "anamnese", label: "Anamnese", icon: HeartPulse },
];

const labelStyle = { fontSize: 13.5, fontWeight: 600, color: T.muted };

/* A leitura do .docx acontece no navegador. Só depois de o usuário conferir o texto é que ele é gravado,
   pelas mesmas rotas de prontuário, anamnese e documentos usadas no restante do sistema. */
export default function Importacoes({ secoes }) {
  const { patients, saveRecord, saveAnamnese, addDocument, errors = {} } = useAppData();
  const params = new URLSearchParams(window.location.search);
  const [tipo, setTipo] = useState(params.get("tipo") === "anamnese" ? "anamnese" : "prontuario");
  const [patientId, setPatientId] = useState(() => Number(params.get("paciente")) || (patients[0] ? patients[0].id : ""));
  const [arquivo, setArquivo] = useState(null);
  const [lendo, setLendo] = useState(false);
  const [erroLeitura, setErroLeitura] = useState("");
  const [registro, setRegistro] = useState(null);   // prontuário lido
  const [leitura, setLeitura] = useState(null);     // anamnese lida: { respostas, sobras }
  const [anexar, setAnexar] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feitas, setFeitas] = useState([]);
  const fileRef = useRef(null);

  const paciente = patients.find((p) => p.id === Number(patientId));
  const perguntas = secoes.flatMap((s) => s.fields.map((f) => ({ ...f, secao: s.title })));

  function limpar() {
    setArquivo(null); setRegistro(null); setLeitura(null); setErroLeitura("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function trocarTipo(t) {
    limpar();
    setTipo(t);
  }

  async function escolherArquivo(file) {
    limpar();
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) { setErroLeitura("Escolha um arquivo .docx (Word)."); return; }
    setArquivo(file);
    setLendo(true);
    try {
      const texto = await lerDocx(file);
      if (!texto) throw new Error("vazio");
      if (tipo === "prontuario") setRegistro(lerProntuario(texto));
      else setLeitura(lerAnamnese(texto, secoes));
    } catch {
      setErroLeitura("Não consegui ler esse arquivo. Confira se ele é um .docx válido e tem texto.");
      setArquivo(null);
    } finally {
      setLendo(false);
    }
  }

  function concluir(resumo) {
    setFeitas((f) => [{ ...resumo, paciente, hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...f]);
    setSalvando(false);
    limpar();
  }

  /* O documento original é anexado depois que o registro foi gravado. */
  function anexarOriginal(resumo) {
    if (!anexar || !arquivo) { concluir(resumo); return; }
    const titulo = `${tipo === "prontuario" ? "Prontuário" : "Anamnese"} importado — ${arquivo.name}`;
    addDocument(Number(patientId), { title: titulo, file: arquivo }, { onSuccess: () => concluir(resumo), onError: () => concluir({ ...resumo, semAnexo: true }) });
  }

  function importarProntuario() {
    setSalvando(true);
    const { date, tecnicas, objetivo, descricao } = registro;
    saveRecord(Number(patientId), { date, tecnicas, objetivo, descricao }, {
      onSuccess: () => anexarOriginal({ tipo: "prontuario", arquivo: arquivo.name }),
      onError: () => setSalvando(false),
    });
  }

  function importarAnamnese() {
    setSalvando(true);
    saveAnamnese(Number(patientId), { titulo: `Importada de ${arquivo.name.replace(/\.docx$/i, "")}`, respostas: leitura.respostas }, {
      onSuccess: () => anexarOriginal({ tipo: "anamnese", arquivo: arquivo.name }),
      onError: () => setSalvando(false),
    });
  }

  const reconhecidas = leitura ? Object.keys(leitura.respostas).length : 0;

  return (
    <div>
      <PageHeader title="Importações" subtitle="Traga prontuários e anamneses de arquivos Word (.docx) para o perfil do paciente" />

      {/* Tipo */}
      <div style={{ display: "flex", gap: 6, background: T.mutedBg, borderRadius: 14, padding: 5, marginBottom: 18, width: "fit-content" }}>
        {TIPOS.map((t) => {
          const on = tipo === t.key;
          return (
            <button
              key={t.key}
              onClick={() => trocarTipo(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                fontFamily: FONT_DISPLAY, fontSize: 15.5, fontWeight: 600, background: on ? T.primary : "transparent", color: on ? "#fff" : T.muted,
                boxShadow: on ? "0 4px 10px rgba(76,111,255,0.28)" : "none",
              }}
            >
              <t.icon size={18} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Passo 1 */}
      <Card style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 16 }}>1. Paciente e arquivo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0 20px", alignItems: "start" }}>
          <div>
            <label style={labelStyle}>De quem é {tipo === "prontuario" ? "o prontuário" : "a anamnese"}?</label>
            <select value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} style={inputStyle}>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {tipo === "anamnese" && (
              <div style={{ fontSize: 13, color: T.muted, marginTop: -6 }}>
                Vira uma <strong style={{ color: T.text }}>nova</strong> anamnese; as que o paciente já tem não mudam.
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Arquivo do Word (.docx)</label>
            <input ref={fileRef} type="file" accept=".docx" onChange={(e) => escolherArquivo(e.target.files[0])} style={{ display: "none" }} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); escolherArquivo(e.dataTransfer.files[0]); }}
              style={{ margin: "7px 0 16px", border: `1.5px dashed ${T.primary}`, background: T.primaryTint, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
            >
              <button
                type="button"
                onClick={() => fileRef.current && fileRef.current.click()}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "none", background: T.primary, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                <Upload size={17} /> Escolher arquivo
              </button>
              <span style={{ fontSize: 13.5, color: arquivo ? T.text : T.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                {lendo ? "Lendo o arquivo..." : arquivo ? arquivo.name : "ou arraste o .docx para cá"}
              </span>
            </div>
            <ErrorText>{erroLeitura}</ErrorText>
          </div>
        </div>
      </Card>

      {/* Passo 2: prontuário */}
      {tipo === "prontuario" && registro && (
        <Card style={{ padding: 24, marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 4 }}>2. Confira o prontuário</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 16 }}>
            {registro.dataEncontrada ? "Encontrei a data no documento." : "Não encontrei uma data no documento; usei a de hoje."} Ajuste o que precisar antes de importar.
          </div>
          <div style={{ maxWidth: 260 }}>
            <FormField label="Data do atendimento *" value={registro.date} onChange={(v) => setRegistro({ ...registro, date: v })} placeholder="dd/mm/aaaa" error={errors.date} />
          </div>
          <FormField label="Técnicas utilizadas" value={registro.tecnicas} onChange={(v) => setRegistro({ ...registro, tecnicas: v })} textarea error={errors.tecnicas} />
          <FormField label="Objetivo da sessão" value={registro.objetivo} onChange={(v) => setRegistro({ ...registro, objetivo: v })} textarea error={errors.objetivo} />
          <FormField label="Descrição *" value={registro.descricao} onChange={(v) => setRegistro({ ...registro, descricao: v })} textarea error={errors.descricao} />
          <Rodape anexar={anexar} setAnexar={setAnexar} salvando={salvando} onImportar={importarProntuario} rotulo={`Importar para ${paciente ? paciente.name : "o paciente"}`} />
        </Card>
      )}

      {/* Passo 2: anamnese */}
      {tipo === "anamnese" && leitura && (
        <Card style={{ padding: 24, marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 4 }}>2. Confira a anamnese</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 16 }}>
            Reconheci <strong style={{ color: T.text }}>{reconhecidas}</strong> de {perguntas.length} perguntas pelo enunciado. Corrija ou complete as respostas abaixo antes de importar.
          </div>

          {reconhecidas === 0 && (
            <div style={{ fontSize: 13.5, color: T.warnText, background: T.warnTint, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              Nenhuma pergunta foi reconhecida. O documento precisa trazer os enunciados da ficha (por exemplo “Nome:”, “Queixa principal:”).
              {leitura.sobras && " Abaixo está o texto lido, para você copiar para as perguntas certas."}
            </div>
          )}

          {secoes.map((s) => {
            const campos = s.fields.filter((f) => leitura.respostas[f.key] !== undefined);
            if (!campos.length) return null;
            return (
              <div key={s.title} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{s.title}</div>
                {campos.map((f) => (
                  <FormField
                    key={f.key}
                    label={f.label}
                    value={leitura.respostas[f.key]}
                    onChange={(v) => setLeitura({ ...leitura, respostas: { ...leitura.respostas, [f.key]: v } })}
                    textarea
                  />
                ))}
              </div>
            );
          })}

          {leitura.sobras && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Texto não associado a nenhuma pergunta (não será importado)</div>
              <div style={{ fontSize: 13, color: T.muted, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, whiteSpace: "pre-wrap", maxHeight: 180, overflowY: "auto" }}>{leitura.sobras}</div>
            </div>
          )}

          <Rodape anexar={anexar} setAnexar={setAnexar} salvando={salvando} desabilitado={reconhecidas === 0} onImportar={importarAnamnese} rotulo={`Importar para ${paciente ? paciente.name : "o paciente"}`} />
        </Card>
      )}

      {/* Importados nesta sessão */}
      {feitas.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Importado agora
          </div>
          {feitas.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i > 0 ? `1px solid ${T.border}` : "none", flexWrap: "wrap" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: T.successTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={19} color={T.success} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  {f.tipo === "prontuario" ? "Prontuário" : "Anamnese"} de {f.paciente ? f.paciente.name : "paciente"}
                </div>
                <div style={{ fontSize: 12.5, color: T.muted }}>
                  {f.arquivo} · {f.hora}{f.semAnexo ? " · o arquivo original não pôde ser anexado" : ""}
                </div>
              </div>
              {f.paciente && (
                <button
                  onClick={() => router.visit(`/pacientes/${f.paciente.id}?aba=${f.tipo}`)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.primary, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
                >
                  <FileUp size={16} /> Ver no perfil
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function Rodape({ anexar, setAnexar, salvando, desabilitado, onImportar, rotulo }) {
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 6 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: T.text, cursor: "pointer", marginBottom: 14 }}>
        <input type="checkbox" checked={anexar} onChange={(e) => setAnexar(e.target.checked)} />
        Guardar também o arquivo original na aba Documentos do paciente
      </label>
      <PrimaryButton icon={Check} onClick={onImportar} disabled={salvando || desabilitado} style={{ padding: "12px 22px", fontSize: 15 }}>
        {salvando ? "Importando..." : rotulo}
      </PrimaryButton>
    </div>
  );
}
