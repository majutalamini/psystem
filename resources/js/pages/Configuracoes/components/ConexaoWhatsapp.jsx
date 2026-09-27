import { useEffect } from "react";
import { router } from "@inertiajs/react";
import { Link2, LogOut, RefreshCw } from "lucide-react";
import { Pill } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import SettingsSection from "./SettingsSection";

const ESTADOS = {
  open: { label: "Conectado", tone: "success" },
  connecting: { label: "Aguardando o QR code", tone: "warn" },
  close: { label: "Desconectado", tone: "danger" },
  erro: { label: "Erro", tone: "danger" },
};

const botao = {
  display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
  border: `1px solid ${T.border}`, background: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer", color: T.text,
};

/* Modo evolution: o celular se conecta ao sistema pelo QR code, como no WhatsApp Web. */
export default function ConexaoWhatsapp({ conexao }) {
  const { disconnectWhatsapp } = useAppData();
  const estado = ESTADOS[conexao?.estado] || ESTADOS.erro;
  const atualizar = () => router.reload({ only: ["whatsappConexao"] });

  // O QR code vence em uns 40 segundos: enquanto não conecta, busca um novo a cada 20.
  useEffect(() => {
    if (!conexao || conexao.estado === "open") return undefined;
    const id = setInterval(atualizar, 20000);
    return () => clearInterval(id);
  }, [conexao?.estado]);

  return (
    <SettingsSection
      icon={Link2}
      tone="whatsapp"
      title="Conexão do WhatsApp"
      description="O número que escanear o QR code passa a enviar as mensagens automáticas do sistema."
      action={<Pill tone={estado.tone}>{estado.label}</Pill>}
    >
      {conexao?.erro && <div style={{ fontSize: 13.5, color: T.danger, marginBottom: 14 }}>{conexao.erro}</div>}

      {conexao?.qr && conexao.estado !== "open" && (
        <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <img src={conexao.qr} alt="QR code para conectar o WhatsApp" style={{ width: 230, height: 230, border: `1px solid ${T.border}`, borderRadius: 12 }} />
          <ol style={{ fontSize: 14, color: T.text, lineHeight: 1.9, margin: 0, paddingLeft: 18, maxWidth: 360 }}>
            <li>Abra o WhatsApp no celular.</li>
            <li>Toque em <strong>Aparelhos conectados</strong> › <strong>Conectar um aparelho</strong>.</li>
            <li>Aponte a câmera para este QR code.</li>
            <li style={{ color: T.muted }}>O código muda sozinho a cada 20 segundos.</li>
          </ol>
        </div>
      )}

      {conexao?.estado === "open" && (
        <div style={{ fontSize: 13.5, color: T.muted, marginBottom: 16 }}>
          Conectado. Para parar de enviar por este número, clique em Desconectar (ou remova o aparelho "Psystem" em Aparelhos conectados no celular).
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={atualizar} style={botao}><RefreshCw size={16} /> Atualizar</button>
        {conexao?.estado === "open" && (
          <button onClick={disconnectWhatsapp} style={{ ...botao, color: T.danger }}><LogOut size={16} /> Desconectar</button>
        )}
      </div>
    </SettingsSection>
  );
}
