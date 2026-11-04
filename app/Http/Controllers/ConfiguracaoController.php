<?php

namespace App\Http\Controllers;

use App\Models\Configuracao;
use App\Models\Matricula;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
            'horario.intervalo' => 'nullable|integer|min:0|max:120',
            'horario.almocoInicio' => 'nullable|required_with:horario.almocoFim|date_format:H:i|after:horario.inicio',
            'horario.almocoFim' => 'nullable|required_with:horario.almocoInicio|date_format:H:i|after:horario.almocoInicio|before:horario.fim',
            'goals.faturamentoMensal' => 'required|numeric|min:0',
            'goals.horasSemanais' => 'required|integer|min:0',
            'goals.sessoesSemanais' => 'required|integer|min:0',
            'goals.novosPacientesMes' => 'required|integer|min:0',
        ], [
            'perfil.crp.unique' => 'Já existe uma psicóloga cadastrada com este CRP.',
            'perfil.email.unique' => 'Já existe uma psicóloga cadastrada com este e-mail.',
        ], [
            'senha.atual' => 'senha atual', 'senha.nova' => 'nova senha', 'horario.fim' => 'término do expediente',
        ]);

        $this->conferirMatriculas($dados['horario']);

        $psicologo->fill($dados['perfil']);
        if (! empty($dados['senha']['nova'])) {
            $psicologo->senha_hash = $dados['senha']['nova'];
        }
        $psicologo->save();

        $config = Configuracao::atual();
        $config->update([
            'dias_atendimento' => $dados['horario']['dias'] ?? [],
            'expediente_inicio' => $dados['horario']['inicio'],
            'expediente_fim' => $dados['horario']['fim'],
            'duracao_sessao' => $dados['horario']['duracao'],
            'intervalo_sessao' => (int) ($dados['horario']['intervalo'] ?? 0),
            'almoco_inicio' => ($dados['horario']['almocoInicio'] ?? null) ?: null,
            'almoco_fim' => ($dados['horario']['almocoFim'] ?? null) ?: null,
            'meta_faturamento_mensal' => $dados['goals']['faturamentoMensal'],
            'meta_horas_semanais' => $dados['goals']['horasSemanais'],
            'meta_sessoes_semanais' => $dados['goals']['sessoesSemanais'],
            'meta_novos_pacientes_mes' => $dados['goals']['novosPacientesMes'],
        ]);

        $horarios = $config->horarios();
        $fora = Matricula::ativas()
            ->with('paciente')
            ->get()
            ->filter(fn (Matricula $m) => ! $config->atendeNo($m->dia_da_matricula)
                || ! in_array(substr($m->horario_da_matricula, 0, 5), $horarios, true))
            ->map(fn (Matricula $m) => "{$m->paciente->nome} ({$m->dia_da_matricula} às ".substr($m->horario_da_matricula, 0, 5).')');

        $aviso = $fora->isEmpty()
            ? 'Alterações salvas com sucesso.'
            : 'Alterações salvas com sucesso. Atenção: matrícula(s) fora do expediente: '.$fora->implode(', ').'.';

        return back()->with('aviso', $aviso);
    }

    /** Dia ou horário que ainda tem matrícula ativa não pode sair do expediente: a matrícula precisa ser alterada antes. */
    private function conferirMatriculas(array $horario): void
    {
        $dias = $horario['dias'] ?? [];
        $config = new Configuracao([
            'expediente_inicio' => $horario['inicio'],
            'expediente_fim' => $horario['fim'],
            'duracao_sessao' => $horario['duracao'],
            'intervalo_sessao' => (int) ($horario['intervalo'] ?? 0),
            'almoco_inicio' => ($horario['almocoInicio'] ?? null) ?: null,
            'almoco_fim' => ($horario['almocoFim'] ?? null) ?: null,
        ]);
        $horas = $config->horarios();
        $rotulos = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

        $semDia = $foraDoExpediente = [];
        foreach (Matricula::ativas()->with('paciente')->orderBy('id')->get() as $matricula) {
            $hora = substr($matricula->horario_da_matricula, 0, 5);
            $descricao = "{$matricula->paciente->nome} ({$matricula->dia_da_matricula}, {$hora})";

            if (! in_array($rotulos[$matricula->diaIso() - 1], $dias, true)) {
                $semDia[] = $descricao;
            } elseif (! in_array($hora, $horas, true)) {
                $foraDoExpediente[] = $descricao;
            }
        }

        $erros = [];
        if ($semDia) {
            $erros['horario.dias'] = 'Este dia não pode ser removido: há matrícula ativa nele — '.implode('; ', $semDia).'. Altere a matrícula para outro dia/horário antes de retirar o dia do atendimento.';
        }
        if ($foraDoExpediente) {
            $erros['horario.inicio'] = 'O expediente não pode deixar de fora horários com matrícula ativa — '.implode('; ', $foraDoExpediente).'. Altere a matrícula antes de mudar o expediente.';
        }
        if ($erros) {
            throw ValidationException::withMessages($erros);
        }
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
