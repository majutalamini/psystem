<?php

namespace App\Http\Controllers;

use App\Actions\CriarMatricula;
use App\Actions\InativarPaciente;
use App\Models\Configuracao;
use App\Models\Matricula;
use App\Models\Paciente;
use App\Models\RegistroAcao;
use App\Services\AgendaMatricula;
use App\Services\HorarioConsulta;
use App\Services\Mensalidades;
use App\Services\OcupacaoAgenda;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatriculaController extends Controller
{
    /** Cria a matrícula, ativa o paciente e gera as consultas da janela de dois meses. */
    public function store(Request $request, Paciente $paciente, AgendaMatricula $agenda, Mensalidades $mensalidades)
    {
        $dados = $this->validar($request);

        DB::transaction(function () use ($paciente, $dados, $agenda, $mensalidades) {
            $this->conferirOcupacao($dados, $paciente);
            $matricula = CriarMatricula::executar([
                'paciente_id' => $paciente->id,
                ...$this->colunas($dados),
                'inicio_da_matricula' => today(),
            ]);

            $paciente->sincronizarStatus();
            $agenda->gerar($matricula->setRelation('paciente', $paciente));
            RegistroAcao::registrar('matricula.criar', $matricula);
            $mensalidades->gerar($matricula);
        });

        return back();
    }

    /** Altera a matrícula e refaz as consultas futuras ainda não confirmadas. */
    public function update(Request $request, Matricula $matricula, AgendaMatricula $agenda, Mensalidades $mensalidades)
    {
        if (! $matricula->ativa()) {
            throw ValidationException::withMessages(['time' => 'Esta matrícula já foi encerrada.']);
        }

        $dados = $this->validar($request);

        DB::transaction(function () use ($matricula, $dados, $agenda, $mensalidades) {
            $this->conferirOcupacao($dados, $matricula->paciente, $matricula);
            $agenda->limparFuturas($matricula);
            $matricula->update($this->colunas($dados));
            $agenda->gerar($matricula);
            RegistroAcao::registrar('matricula.alterar', $matricula);
            $mensalidades->atualizarValor($matricula);
            $mensalidades->garantir($matricula);
        });

        return back();
    }

    /**
     * Encerrar mantém a matrícula no histórico e tira da agenda as consultas futuras dela.
     * Sendo a última matrícula ativa, o paciente é inativado: todas as consultas futuras saem.
     */
    public function destroy(Request $request, Matricula $matricula, AgendaMatricula $agenda, Mensalidades $mensalidades)
    {
        if (! $matricula->ativa()) {
            return back();
        }

        DB::transaction(function () use ($request, $matricula, $agenda, $mensalidades) {
            if ($request->boolean('cancelarMensalidades')) {
                $mensalidades->cancelarFuturas($matricula);
            }
            $paciente = $matricula->paciente;
            if ($paciente->matriculas()->ativas()->count() <= 1) {
                InativarPaciente::executar($paciente, 'time');

                return;
            }

            $agenda->limparFuturas($matricula);
            $matricula->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
            $matricula->paciente->sincronizarStatus();
            RegistroAcao::registrar('matricula.encerrar', $matricula);
        });

        return back();
    }

    private function validar(Request $request): array
    {
        $dados = $request->validate([
            'weekday' => 'required|integer|between:0,6',
            'time' => 'required|date_format:H:i',
            'tipo' => 'required|in:Consulta presencial,Consulta online',
            'valor' => 'required|numeric|min:0',
        ], [
            'diaVencimento.required_if' => 'Informe o dia de vencimento da mensalidade.',
        ], [
            'diaVencimento' => 'dia de vencimento',
        ]);

        $config = Configuracao::atual();
        if (! $config->atendeNo((int) $dados['weekday'])) {
            throw ValidationException::withMessages(['weekday' => 'Não há atendimento nesse dia da semana.']);
        }
        if (! in_array($dados['time'], $config->horarios(), true)) {
            throw ValidationException::withMessages(['time' => 'Esse horário está fora do expediente.']);
        }

        return $dados;
    }

    /**
     * Sob o bloqueio do dia/horário: o paciente não repete o mesmo horário em duas matrículas e,
     * havendo limite de consultas simultâneas, as matrículas de outros pacientes não passam dele.
     */
    private function conferirOcupacao(array $dados, Paciente $paciente, ?Matricula $atual = null): void
    {
        $dia = Matricula::DIAS[$dados['weekday']];
        HorarioConsulta::bloquearReserva($dia, $dados['time']);

        $mesmoHorario = Matricula::ativas()
            ->where('dia_da_matricula', $dia)
            ->where('horario_da_matricula', $dados['time'])
            ->when($atual, fn ($q) => $q->where('id', '!=', $atual->id))
            ->whereHas('paciente', fn ($q) => $q->where('status_paciente', 'ativo')->orWhere('pacientes.id', $paciente->id))
            ->with('paciente:id,nome')
            ->get();

        if ($mesmoHorario->contains('paciente_id', $paciente->id)) {
            throw ValidationException::withMessages(['time' => 'Esse horário já é de outra matrícula deste paciente.']);
        }

        $limite = Configuracao::atual()->consultas_simultaneas;
        if ($limite !== null && $mesmoHorario->count() >= $limite) {
            throw ValidationException::withMessages([
                'time' => $limite === 1
                    ? "Esse horário já é da matrícula de {$mesmoHorario->first()->paciente->nome}."
                    : OcupacaoAgenda::mensagemLimite($limite),
            ]);
        }
    }

    private function colunas(array $dados): array
    {
        return [
            'dia_da_matricula' => Matricula::DIAS[$dados['weekday']],
            'horario_da_matricula' => $dados['time'],
            'tipo_da_consulta' => $dados['tipo'] === 'Consulta online' ? 'online' : 'presencial',
            'valor_sessao' => $dados['valor'],
        ];
    }
}
