import { useState } from "react";
import { router } from "@inertiajs/react";
import { Mail, Phone, Plus, UserRoundCheck, Users } from "lucide-react";
import { Avatar, Card, Pill, PrimaryButton, SearchInput } from "../../components/ui";
import { T } from "../../styles/theme";
import GuardianModal from "./components/GuardianModal";

export default function Responsaveis({ guardians }) {
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const lista = guardians.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color: T.text, margin: 0 }}>Responsáveis</h1>
          <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar" />
        </div>
        <PrimaryButton icon={Plus} onClick={() => setShowNew(true)}>NOVO RESPONSÁVEL</PrimaryButton>
      </div>

      <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 14, maxWidth: 640 }}>
        Paciente menor de idade precisa ter um responsável no cadastro. Um responsável pode responder por mais de um paciente.
      </div>

      <Card style={{ overflow: "hidden" }}>
        {lista.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <UserRoundCheck size={36} style={{ opacity: 0.45 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginTop: 10 }}>
              {guardians.length === 0 ? "Nenhum responsável cadastrado" : "Nenhum responsável encontrado"}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surfaceAlt, textAlign: "left" }}>
                {["Responsável", "Contato", "Pacientes"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", fontSize: 12.5, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((g) => (
                <tr
                  key={g.id}
                  onClick={() => router.visit(`/responsaveis/${g.id}`)}
                  style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceAlt)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar initials={g.initials} color={g.color} size={40} />
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: T.text }}>{g.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: T.muted }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><Phone size={16} /> {g.phone}</div>
                    {g.email && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={16} /> {g.email}</div>}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <Pill tone={g.dependentes ? "primary" : "muted"}>
                      <Users size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                      {g.dependentes} {g.dependentes === 1 ? "paciente" : "pacientes"}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && <GuardianModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
