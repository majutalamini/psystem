import { Link, useForm } from "@inertiajs/react";
import AuthCard from "../../components/layout/AuthCard";
import { FormField, PrimaryButton } from "../../components/ui";
import { T } from "../../styles/theme";

export default function Login() {
  const form = useForm({ email: "", password: "", remember: false });

  function submit(e) {
    e.preventDefault();
    form.post("/login", { onFinish: () => form.reset("password") });
  }

  return (
    <AuthCard>
      <form onSubmit={submit}>
        <FormField label="E-mail" type="email" value={form.data.email} onChange={(v) => form.setData("email", v)} error={form.errors.email} />
        <FormField label="Senha" type="password" value={form.data.password} onChange={(v) => form.setData("password", v)} error={form.errors.password} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: T.muted }}>
            <input type="checkbox" checked={form.data.remember} onChange={(e) => form.setData("remember", e.target.checked)} />
            Manter conectado
          </label>
          <Link href="/esqueci-senha" style={{ fontSize: 13.5, fontWeight: 600, color: T.primary, textDecoration: "none" }}>Esqueci minha senha</Link>
        </div>
        <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center" }} disabled={form.processing}>Entrar</PrimaryButton>
      </form>
    </AuthCard>
  );
}
