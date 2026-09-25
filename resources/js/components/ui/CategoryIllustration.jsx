export default function CategoryIllustration({ icon: Icon, badgeIcon: BadgeIcon, accent, accentTint }) {
  return (
    <div style={{ position: "absolute", right: 0, bottom: 0, width: 220, height: 220, pointerEvents: "none" }}>
      <div style={{ position: "absolute", right: -40, bottom: -40, width: 220, height: 220, borderRadius: "50%", background: accentTint, opacity: 0.6 }} />
      <div style={{ position: "absolute", right: 30, bottom: 34, width: 100, height: 100, borderRadius: 24, background: "#fff", boxShadow: "0 14px 30px rgba(28,34,51,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={42} color={accent} />
      </div>
      <div style={{ position: "absolute", right: 20, bottom: 124, width: 44, height: 44, borderRadius: "50%", background: "#fff", boxShadow: "0 8px 18px rgba(28,34,51,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BadgeIcon size={20} color={accent} />
      </div>
    </div>
  );
}
