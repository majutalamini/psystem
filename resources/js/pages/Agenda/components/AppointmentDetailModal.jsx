import { Avatar, Modal, Pill, PrimaryButton } from "../../../components/ui";
import { useAppData } from "../../../hooks/useAppData";
import { T } from "../../../styles/theme";
import { initialsFromName } from "../../../utils/format";
import { navigate } from "../../../utils/nav";

const STATUS_TONE = { agendado: "warn", confirmado: "success", realizado: "primary", falta: "danger" };

/* "Realizado" gera a cobrança da sessão; sair de "Realizado" cancela a cobrança ainda não paga. */
const ACTIONS = [
  { key: "confirmado", label: "Confirmar", color: T.success, tint: T.successTint },
  { key: "realizado", label: "Realizado", color: T.primary, tint: T.primaryTint },
  { key: "falta", label: "Falta", color: "#8A6413", tint: T.warnTint },
  { key: "cancelado", label: "Cancelar", color: T.danger, tint: T.dangerTint },
];

export default function AppointmentDetailModal({ event, dateLabel, onClose }) {
  const { patients, setAppointmentStatus } = useAppData();
  const patient = patients.find((p) => p.id === event.patientId);

  function changeStatus(status) {
    setAppointmentStatus(event.id, status, { onSuccess: onClose });
  }

  return (
    <Modal title="Detalhes do agendamento" onClose={onClose} width={420}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar initials={patient ? patient.initials : initialsFromName(event.name)} color={event.color} src={patient && patient.photo} size={46} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{event.name}</div>
          <div style={{ fontSize: 12.5, color: T.muted, textTransform: "capitalize" }}>{dateLabel} às {event.time}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Pill tone="muted">{event.type}</Pill>
        <Pill tone={STATUS_TONE[event.statusKey] || "muted"}>{event.status}</Pill>
        {event.recurring && <Pill tone="primary">Matrícula semanal</Pill>}
      </div>
      {event.recurring && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
          Este paciente tem matrícula fixa nesse dia e horário. Cancelar aqui remove só esta data — os próximos horários continuam agendados automaticamente.
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.4, margin: "4px 0 8px" }}>Marcar como</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {ACTIONS.filter((a) => a.key !== event.statusKey).map((a) => (
          <button
            key={a.key}
            onClick={() => changeStatus(a.key)}
            style={{ padding: "10px 0", borderRadius: 10, border: `1px solid ${a.tint}`, background: a.tint, color: a.color, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
          >
            {a.label}
          </button>
        ))}
      </div>

      <PrimaryButton
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() => { onClose(); navigate("prontuarios", { paciente: event.patientId }); }}
      >
        Ver prontuário
      </PrimaryButton>
    </Modal>
  );
}
