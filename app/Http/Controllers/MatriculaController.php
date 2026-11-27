<?php

namespace App\Http\Controllers;

use App\Models\Contrato;
use App\Models\Matricula;
use App\Services\AgendaMatricula;
use App\Services\Contratos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Dias e horários fixos do contrato. Cada mudança recalcula quando termina o pacote atual. */
class MatriculaController extends Controller
{
    /** Acrescenta um dia e horário ao contrato e gera a agenda dele. */
    public function store(Request $request, Contrato $contrato, Contratos $contratos)
    {
        if (! $contrato->aberto()) {
            throw ValidationException::withMessages(['time' => 'Este contrato já foi encerrado.']);
        }

        $dados = $this->validar($request, $contrato->paciente_id);

        DB::transaction(function () use ($contrato, $dados, $contratos) {
            $contratos->novaMatricula($contrato, $dados);
            $contratos->recalcularFim($contrato);
            $contratos->gerarAgenda($contrato);
        });

        return back();
    }

    /** Altera o dia/horário e refaz as consultas futuras ainda não confirmadas. */
    public function update(Request $request, Matricula $matricula, AgendaMatricula $agenda, Contratos $contratos)
    {
        if (! $matricula->ativa()) {
            throw ValidationException::withMessages(['time' => 'Esta matrícula já foi encerrada.']);
        }

        $dados = $this->validar($request, $matricula->paciente_id, $matricula);

        DB::transaction(function () use ($matricula, $dados, $agenda, $contratos) {
            $agenda->limparFuturas($matricula);
            $matricula->update([
                'dia_da_matricula' => Matricula::DIAS[$dados['weekday']],
                'horario_da_matricula' => $dados['time'],
                'tipo_da_consulta' => $dados['tipo'] === 'Consulta online' ? 'online' : 'presencial',
            ]);
            if ($matricula->contrato) {
                $contratos->recalcularFim($matricula->contrato);
            }
            $agenda->gerar($matricula);
        });

        return back();
    }

    /** Tira o horário do contrato (o contrato precisa ficar com ao menos um; para parar tudo, encerre o contrato). */
    public function destroy(Matricula $matricula, AgendaMatricula $agenda, Contratos $contratos)
    {
        if (! $matricula->ativa()) {
            return back();
        }

        $contrato = $matricula->contrato;
        if ($contrato?->aberto() && $contrato->matriculas()->ativas()->count() <= 1) {
            throw ValidationException::withMessages([
                'matricula' => 'O contrato precisa de ao menos um dia e horário. Para parar os atendimentos, encerre o contrato.',
            ]);
        }

        DB::transaction(function () use ($matricula, $agenda, $contratos, $contrato) {
            $agenda->limparFuturas($matricula);
            $matricula->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
            if ($contrato) {
                $contratos->recalcularFim($contrato);
            }
            $matricula->paciente->sincronizarStatus();
        });

        return back();
    }

    private function validar(Request $request, int $pacienteId, ?Matricula $atual = null): array
    {
        $dados = $request->validate([
            'weekday' => 'required|integer|between:0,6',
            'time' => 'required|date_format:H:i',
            'tipo' => 'required|in:Consulta presencial,Consulta online',
        ]);

        Matricula::conferirHorario((int) $dados['weekday'], $dados['time'], $pacienteId, $atual?->id);

        return $dados;
    }
}
