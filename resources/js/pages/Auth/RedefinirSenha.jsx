import { Link, useForm } from "@inertiajs/react";
import AuthCard from "../../components/layout/AuthCard";
import { FormField, PrimaryButton } from "../../components/ui";
import { T } from "../../styles/theme";

/* Aberta pelo link do e-mail (token + e-mail na URL). */
export default function RedefinirSenha({ token, email }) {
  const form = useForm({ token, email, password: "", password_confirmation: "" });

  function submit(e) {
    e.preventDefault();
    form.post("/redefinir-senha", { onFinish: () => form.reset("password", "password_confirmation") });
  }

  return (
    <AuthCard title="Criar nova senha">
      <form onSubmit={submit}>
        <FormField label="E-mail" type="email" value={form.data.email} onChange={(v) => form.setData("email", v)} error={form.errors.email} />
        <FormField label="Nova senha" type="password" value={form.data.password} onChange={(v) => form.setData("password", v)} error={form.errors.password} placeholder="Ao menos 8 caracteres" />
        <FormField label="Repita a nova senha" type="password" value={form.data.password_confirmation} onChange={(v) => form.setData("password_confirmation", v)} />
        <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center" }} disabled={form.processing}>Salvar nova senha</PrimaryButton>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/login" style={{ fontSize: 13.5, fontWeight: 600, color: T.primary, textDecoration: "none" }}>Voltar para o login</Link>
      </div>
    </AuthCard>
  );
}
