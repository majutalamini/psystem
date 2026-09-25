<?php

namespace App\Http\Controllers;

use App\Models\Matricula;
use App\Models\Paciente;
use App\Services\AgendaMatricula;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatriculaController extends Controller
{
    /** Cria ou altera a matrícula e refaz as consultas futuras ainda não confirmadas. */
    public function update(Request $request, Paciente $paciente, AgendaMatricula $agenda)
    {
        $dados = $request->validate([
            'weekday' => 'required|integer|between:0,6',
            'time' => 'required|date_format:H:i',
            'tipo' => 'required|in:Consulta presencial,Consulta online',
            'valor' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($paciente, $dados, $agenda) {
            $matricula = $paciente->matricula ?? new Matricula([
                'paciente_id' => $paciente->id,
                'inicio_da_matricula' => today(),
            ]);

            if ($matricula->exists) {
                $agenda->limparFuturas($matricula);
            }

            $matricula->fill([
                'dia_da_matricula' => Matricula::DIAS[$dados['weekday']],
                'horario_da_matricula' => $dados['time'],
                'tipo_da_consulta' => $dados['tipo'] === 'Consulta online' ? 'online' : 'presencial',
                'valor_sessao' => $dados['valor'],
            ])->save();

            $agenda->gerar($matricula->setRelation('paciente', $paciente));
        });

        return back();
    }

    public function destroy(Paciente $paciente, AgendaMatricula $agenda)
    {
        if ($paciente->matricula) {
            DB::transaction(function () use ($paciente, $agenda) {
                $agenda->limparFuturas($paciente->matricula);
                $paciente->matricula->delete();
            });
        }

        return back();
    }
}
