import { useState } from "react";
import { FileSignature } from "lucide-react";
import { Card, CategoryIllustration, PageHeader } from "../../components/ui";
import { DECLARATION_TEMPLATES } from "../../data/declarations";
import { T } from "../../styles/theme";
import DeclarationDocumentModal from "./components/DeclarationDocumentModal";
import GenerateDeclarationModal from "./components/GenerateDeclarationModal";

export default function Declaracoes({ onPrint }) {
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [generated, setGenerated] = useState(null); // { template, patient, values }

  return (
    <div>
      <PageHeader title="Declarações" subtitle="Modelos prontos de atestados, declarações e recibos" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {DECLARATION_TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id} style={{ padding: 0, overflow: "hidden", position: "relative", minHeight: 260, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "32px 32px 28px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: t.accentTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <Icon size={26} color={t.accent} />
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: t.accent, marginBottom: 8 }}>{t.title}</div>
                <p style={{ color: T.muted, fontSize: 14.5, lineHeight: 1.6, margin: "0 0 22px", maxWidth: 320 }}>{t.desc}</p>
                <button
                  onClick={() => setActiveTemplate(t)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, background: t.accentTint, color: t.accent,
                    border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    marginTop: "auto", alignSelf: "flex-start",
                  }}
                >
                  <FileSignature size={16} /> Gerar declaração
                </button>
              </div>
              <CategoryIllustration icon={t.icon} badgeIcon={t.badgeIcon} accent={t.accent} accentTint={t.accentTint} />
              <div style={{ height: 5, background: t.accent }} />
            </Card>
          );
        })}
      </div>

      {activeTemplate && !generated && (
        <GenerateDeclarationModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onGenerate={(patient, values) => setGenerated({ template: activeTemplate, patient, values })}
        />
      )}

      {generated && (
        <DeclarationDocumentModal
          template={generated.template}
          patient={generated.patient}
          values={generated.values}
          onClose={() => { setGenerated(null); setActiveTemplate(null); }}
          onPrint={(template, paragraphs) => {
            onPrint({ template, patient: generated.patient, paragraphs });
            setTimeout(() => window.print(), 50);
          }}
        />
      )}
    </div>
  );
}
