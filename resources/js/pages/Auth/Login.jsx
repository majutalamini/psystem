import { useForm } from "@inertiajs/react";
import { Brain } from "lucide-react";
import GlobalStyles from "../../components/layout/GlobalStyles";
import { Card, FormField, PrimaryButton } from "../../components/ui";
import { FONT_DISPLAY, T } from "../../styles/theme";

export default function Login() {
  const form = useForm({ email: "", password: "", remember: false });

  function submit(e) {
    e.preventDefault();
    form.post("/login", { onFinish: () => form.reset("password") });
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyles />
      <Card style={{ width: 380, maxWidth: "100%", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={27} color="#fff" />
          </div>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, color: T.text }}>Psystem</span>
        </div>
        <form onSubmit={submit}>
          <FormField label="E-mail" type="email" value={form.data.email} onChange={(v) => form.setData("email", v)} error={form.errors.email} />
          <FormField label="Senha" type="password" value={form.data.password} onChange={(v) => form.setData("password", v)} error={form.errors.password} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: T.muted, marginBottom: 18 }}>
            <input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData("remember", e.target.checked)} />
            Manter conectado
          </label>
          <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center" }} disabled={form.processing}>Entrar</PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
