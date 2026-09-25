import { todayLabel } from "../../utils/date";

export default function PrintArea({ content }) {
  if (!content) return <div className="print-area" />;
  const { template, paragraphs } = content;
  return (
    <div className="print-area" style={{ padding: "48px 56px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{template.title.toUpperCase()}</div>
      <div style={{ height: 2, width: 60, background: "#1C2233", margin: "8px auto 28px" }} />
      {paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 16, textAlign: "justify" }}>{p}</p>
      ))}
      <p style={{ fontSize: 14, marginTop: 32 }}>Criciúma, {todayLabel()}.</p>
      <div style={{ marginTop: 60, textAlign: "center" }}>
        <div style={{ borderTop: "1px solid #1C2233", width: 260, margin: "0 auto 6px" }} />
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>Dra. Isadora Talamini</div>
        <div style={{ fontSize: 12.5 }}>Psicóloga · CRP 12/34567</div>
      </div>
    </div>
  );
}
