import { Avatar, Modal, Pill, PrimaryButton } from "../../../components/ui";
import { T } from "../../../styles/theme";
import { initialsFromName } from "../../../utils/format";

export default function AppointmentDetailModal({ event, dateLabel, onClose, onCancelAppointment, onGoProntuario }) {
  return (
    <Modal title="Detalhes do agendamento" onClose={onClose} width={380}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Avatar initials={initialsFromName(event.name)} color={event.color} size={46} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{event.name}</div>
          <div style={{ fontSize: 12.5, color: T.muted, textTransform: "capitalize" }}>{dateLabel} às {event.time}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Pill tone="muted">{event.type}</Pill>
        <Pill tone={event.status === "Confirmado" ? "success" : "warn"}>{event.status}</Pill>
        {event.recurring && <Pill tone="primary">Matrícula semanal</Pill>}
      </div>
      {event.recurring && (
        <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
          Este paciente tem matrícula fixa nesse dia e horário. Cancelar aqui remove só esta data — os próximos horários continuam agendados automaticamente.
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={onCancelAppointment}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.dangerTint}`, background: T.dangerTint, color: T.danger, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}
        >
          {event.recurring ? "Cancelar este dia" : "Cancelar agendamento"}
        </button>
        <PrimaryButton style={{ flex: 1, justifyContent: "center" }} onClick={onGoProntuario}>Ver prontuário</PrimaryButton>
      </div>
    </Modal>
  );
}
