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
    /** Consultas do período escolhido (?data=AAAA-MM-DD&visao=dia|semana|mes), sem as canceladas. */
    public function index(Request $request)
    {
        $dia = $request->date('data') ?? today();
        $visao = in_array($request->query('visao'), ['dia', 'semana', 'mes'], true)
            ? $request->query('visao')
            : 'semana';
        $inicioSemana = $dia->copy()->startOfWeek(Carbon::MONDAY);

        [$inicio, $fim] = match ($visao) {
            'dia' => [$dia->copy()->startOfDay(), $dia->copy()->endOfDay()],
            'mes' => [$dia->copy()->startOfMonth()->startOfDay(), $dia->copy()->endOfMonth()->endOfDay()],
            default => [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)],
        };

        $consultas = Consulta::with('paciente')
            ->whereBetween('data_hora_consulta', [$inicio, $fim])
            ->where('status', '!=', 'cancelado')
            ->orderBy('data_hora_consulta')
            ->get();

        return Inertia::render('Agenda/Agenda', [
            'visao' => $visao,
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
            'status' => 'required|in:Matriculado,Agendado,Pendente,Confirmado',
        ]);

        $config = Configuracao::atual();
        if (! $config->atendeNo($dados['date'])) {
            throw ValidationException::withMessages(['date' => 'Não há atendimento nesse dia da semana.']);
        }
        if (! in_array($dados['hora'], $config->horarios(), true)) {
            throw ValidationException::withMessages(['hora' => 'Esse horário está fora do expediente.']);
        }

        $dataHora = Carbon::parse("{$dados['date']} {$dados['hora']}");
        if ($dataHora->lte(now())) {
            throw ValidationException::withMessages(['hora' => 'Esse horário já passou.']);
        }
        if (Consulta::horarioOcupado($dataHora)) {
            throw ValidationException::withMessages(['hora' => 'Já existe uma consulta nesse horário.']);
        }

        Consulta::create([
            'paciente_id' => $dados['patientId'],
            'data_hora_consulta' => $dataHora,
            'duracao_minutos' => $config->duracao_sessao,
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
