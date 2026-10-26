<?php

namespace App\Http\Controllers;

use App\Models\Configuracao;
use App\Models\Matricula;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MatriculaController extends Controller
{
    /** Cria a matrícula, ativa o paciente e gera as consultas das próximas semanas. */
    public function store(Request $request, Paciente $paciente, AgendaMatricula $agenda)
    {
        $dados = $this->validar($request, $paciente);

        DB::transaction(function () use ($paciente, $dados, $agenda) {
            $matricula = $paciente->matriculas()->create([
                ...$this->colunas($dados),
                'inicio_da_matricula' => today(),
            ]);

            $paciente->sincronizarStatus();
            $agenda->gerar($matricula->setRelation('paciente', $paciente));
        });

        return back();
    }

    /** Altera a matrícula e refaz as consultas futuras ainda não confirmadas. */
    public function update(Request $request, Matricula $matricula, AgendaMatricula $agenda)
    {
        if (! $matricula->ativa()) {
            throw ValidationException::withMessages(['time' => 'Esta matrícula já foi encerrada.']);
        }

        $dados = $this->validar($request, $matricula->paciente, $matricula);

        DB::transaction(function () use ($matricula, $dados, $agenda) {
            $agenda->limparFuturas($matricula);
            $matricula->update($this->colunas($dados));
            $agenda->gerar($matricula);
        });

        return back();
    }

    /** Encerrar mantém a matrícula no histórico, tira as consultas futuras da agenda e inativa o paciente se for a última ativa. */
    public function destroy(Matricula $matricula, AgendaMatricula $agenda)
    {
        if ($matricula->ativa()) {
            DB::transaction(function () use ($matricula, $agenda) {
                $agenda->limparFuturas($matricula);
                $matricula->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
                $matricula->paciente->sincronizarStatus();
            });
        }

        return back();
    }

    private function validar(Request $request, Paciente $paciente, ?Matricula $atual = null): array
    {
        $dados = $request->validate([
            'weekday' => 'required|integer|between:0,6',
            'time' => 'required|date_format:H:i',
            'tipo' => 'required|in:Consulta presencial,Consulta online',
            'valor' => 'required|numeric|min:0',
        ]);

        $config = Configuracao::atual();
        if (! $config->atendeNo((int) $dados['weekday'])) {
            throw ValidationException::withMessages(['weekday' => 'Não há atendimento nesse dia da semana.']);
        }
        if (! in_array($dados['time'], $config->horarios(), true)) {
            throw ValidationException::withMessages(['time' => 'Esse horário está fora do expediente.']);
        }

        $ocupado = Matricula::ativas()
            ->where('dia_da_matricula', Matricula::DIAS[$dados['weekday']])
            ->where('horario_da_matricula', $dados['time'])
            ->when($atual, fn ($q) => $q->where('id', '!=', $atual->id))
            ->with('paciente')
            ->first();

        if ($ocupado) {
            throw ValidationException::withMessages([
                'time' => $ocupado->paciente_id === $paciente->id
                    ? 'Esse horário já é de outra matrícula deste paciente.'
                    : "Esse horário já é da matrícula de {$ocupado->paciente->nome}.",
            ]);
        }

        return $dados;
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
