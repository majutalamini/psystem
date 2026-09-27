import { Link, useForm } from "@inertiajs/react";
import AuthCard from "../../components/layout/AuthCard";
import { FormField, PrimaryButton } from "../../components/ui";
import { T } from "../../styles/theme";

export default function EsqueciSenha() {
  const form = useForm({ email: "" });

  function submit(e) {
    e.preventDefault();
    form.post("/esqueci-senha");
  }

  return (
    <AuthCard title="Esqueci minha senha">
      <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>
        Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
      </p>
      <form onSubmit={submit}>
        <FormField label="E-mail" type="email" value={form.data.email} onChange={(v) => form.setData("email", v)} error={form.errors.email} />
        <PrimaryButton type="submit" style={{ width: "100%", justifyContent: "center" }} disabled={form.processing}>Enviar link</PrimaryButton>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/login" style={{ fontSize: 13.5, fontWeight: 600, color: T.primary, textDecoration: "none" }}>Voltar para o login</Link>
      </div>
    </AuthCard>
  );
}
