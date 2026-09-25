<?php

namespace App\Http\Controllers;

use App\Models\Configuracao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ConfiguracaoController extends Controller
{
    public function edit()
    {
        $config = Configuracao::atual();

        return Inertia::render('Configuracoes/Configuracoes', [
            'goals' => $config->metas(),
            'horario' => $config->horario(),
        ]);
    }

    /** O botão "Salvar alterações" manda todas as abas de uma vez. */
    public function update(Request $request)
    {
        $psicologo = $request->user();

        $dados = $request->validate([
            'perfil.nome' => 'required|string|max:150',
            'perfil.crp' => ['required', 'string', 'max:20', Rule::unique('psicologos', 'crp')->ignore($psicologo)],
            'perfil.email' => ['required', 'email', 'max:150', Rule::unique('psicologos', 'email')->ignore($psicologo)],
            'perfil.telefone' => 'nullable|string|max:20',
            'senha.atual' => 'nullable|required_with:senha.nova|current_password',
            'senha.nova' => 'nullable|string|min:8',
            'horario.dias' => 'array',
            'horario.dias.*' => 'in:Seg,Ter,Qua,Qui,Sex,Sáb,Dom',
            'horario.inicio' => 'required|date_format:H:i',
            'horario.fim' => 'required|date_format:H:i|after:horario.inicio',
            'horario.duracao' => 'required|integer|min:10|max:240',
            'goals.faturamentoMensal' => 'required|numeric|min:0',
            'goals.horasSemanais' => 'required|integer|min:0',
            'goals.sessoesSemanais' => 'required|integer|min:0',
            'goals.novosPacientesMes' => 'required|integer|min:0',
            'whatsapp.enabled' => 'boolean',
            'whatsapp.numero' => 'nullable|string|max:20',
            'whatsapp.diasAntes' => 'required|integer|min:0',
            'whatsapp.lembrete' => 'nullable|string',
            'whatsapp.retorno' => 'nullable|string',
            'whatsapp.cobranca' => 'nullable|string',
        ], [], [
            'senha.atual' => 'senha atual', 'senha.nova' => 'nova senha', 'horario.fim' => 'término do expediente',
        ]);

        $psicologo->fill($dados['perfil']);
        if (! empty($dados['senha']['nova'])) {
            $psicologo->senha_hash = $dados['senha']['nova'];
        }
        $psicologo->save();

        Configuracao::atual()->update([
            'dias_atendimento' => $dados['horario']['dias'] ?? [],
            'expediente_inicio' => $dados['horario']['inicio'],
            'expediente_fim' => $dados['horario']['fim'],
            'duracao_sessao' => $dados['horario']['duracao'],
            'meta_faturamento_mensal' => $dados['goals']['faturamentoMensal'],
            'meta_horas_semanais' => $dados['goals']['horasSemanais'],
            'meta_sessoes_semanais' => $dados['goals']['sessoesSemanais'],
            'meta_novos_pacientes_mes' => $dados['goals']['novosPacientesMes'],
            'whatsapp_ativo' => $dados['whatsapp']['enabled'] ?? false,
            'whatsapp_numero' => $dados['whatsapp']['numero'] ?? null,
            'whatsapp_dias_antes' => $dados['whatsapp']['diasAntes'],
            'mensagem_lembrete' => $dados['whatsapp']['lembrete'] ?? null,
            'mensagem_retorno' => $dados['whatsapp']['retorno'] ?? null,
            'mensagem_cobranca' => $dados['whatsapp']['cobranca'] ?? null,
        ]);

        return back()->with('aviso', 'Alterações salvas com sucesso.');
    }

    public function foto(Request $request)
    {
        $request->validate(['foto' => 'required|image|max:4096']);
        $psicologo = $request->user();

        if ($psicologo->foto) {
            Storage::disk('public')->delete($psicologo->foto);
        }
        $psicologo->update(['foto' => $request->file('foto')->store('fotos', 'public')]);

        return back();
    }
}
