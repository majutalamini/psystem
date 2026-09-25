<?php

namespace App\Http\Controllers;

use App\Models\Configuracao;
use App\Models\Consulta;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AgendaController extends Controller
{
    /** Semana do dia escolhido (?data=AAAA-MM-DD), sem as consultas canceladas. */
    public function index(Request $request)
    {
        $dia = $request->date('data') ?? today();
        $inicioSemana = $dia->copy()->startOfWeek(Carbon::MONDAY);

        $consultas = Consulta::with('paciente')
            ->whereBetween('data_hora_consulta', [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)])
            ->where('status', '!=', 'cancelado')
            ->orderBy('data_hora_consulta')
            ->get();

        return Inertia::render('Agenda/Agenda', [
            'selectedDate' => $dia->toDateString(),
            'today' => today()->toDateString(),
            'weekStart' => $inicioSemana->toDateString(),
            'events' => $consultas->map(fn ($c) => [
                ...$c->paraTela(),
                'isoDate' => $c->data_hora_consulta->toDateString(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $dados = $request->validate([
            'patientId' => 'required|exists:pacientes,id',
            'date' => 'required|date_format:Y-m-d',
            'hora' => 'required|date_format:H:i',
            'tipo' => 'required|in:Consulta presencial,Consulta online',
            'status' => 'required|in:Pendente,Confirmado',
        ]);

        $dataHora = Carbon::parse("{$dados['date']} {$dados['hora']}");
        if (Consulta::horarioOcupado($dataHora)) {
            throw ValidationException::withMessages(['hora' => 'Já existe uma consulta nesse horário.']);
        }

        Consulta::create([
            'paciente_id' => $dados['patientId'],
            'data_hora_consulta' => $dataHora,
            'duracao_minutos' => Configuracao::atual()->duracao_sessao,
            'modalidade' => $dados['tipo'] === 'Consulta online' ? 'online' : 'presencial',
            'status' => $dados['status'] === 'Confirmado' ? 'confirmado' : 'agendado',
        ]);

        return back();
    }

    public function status(Request $request, Consulta $consulta)
    {
        $dados = $request->validate([
            'status' => ['required', Rule::in(array_keys(Consulta::STATUS))],
        ]);

        $consulta->alterarStatus($dados['status']);

        return back();
    }
}
