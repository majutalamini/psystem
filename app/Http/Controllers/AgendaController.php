<?php

namespace App\Http\Controllers;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Services\AgendaMatricula;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AgendaController extends Controller
{
    /** Consultas do período escolhido (?data=AAAA-MM-DD&visao=dia|semana|mes), sem as canceladas. */
    public function index(Request $request, AgendaMatricula $matriculas)
    {
        $limite = AgendaMatricula::limite();
        // A agenda só mostra os próximos meses; datas além disso voltam para o último dia visível.
        $dia = ($request->date('data') ?? today())->min($limite->copy());
        $visao = in_array($request->query('visao'), ['dia', 'semana', 'mes'], true)
            ? $request->query('visao')
            : 'semana';
        $inicioSemana = $dia->copy()->startOfWeek(Carbon::MONDAY);

        [$inicio, $fim] = match ($visao) {
            'dia' => [$dia->copy()->startOfDay(), $dia->copy()->endOfDay()],
            'mes' => [$dia->copy()->startOfMonth()->startOfDay(), $dia->copy()->endOfMonth()->endOfDay()],
            default => [$inicioSemana, $inicioSemana->copy()->endOfWeek(Carbon::SUNDAY)],
        };

        $fim = $fim->min($limite->copy()->endOfDay());

        for ($semana = $inicio->copy()->startOfWeek(Carbon::MONDAY); $semana->lte($fim); $semana->addWeek()) {
            $matriculas->gerarSemana($semana);
        }

        $consultas = Consulta::with('paciente')
            ->whereBetween('data_hora_consulta', [$inicio, $fim])
            ->where('status', '!=', 'cancelado')
            ->orderBy('data_hora_consulta')
            ->get();

        return Inertia::render('Agenda/Agenda', [
            'visao' => $visao,
            'selectedDate' => $dia->toDateString(),
            'today' => today()->toDateString(),
            'limite' => $limite->toDateString(),
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
            'valor' => 'required|numeric|min:0',
        ], [
            'valor.required' => 'Informe o valor da consulta (use 0 se não houver cobrança).',
        ]);

        $config = Configuracao::atual();
        if (! $config->atendeNo($dados['date'])) {
            throw ValidationException::withMessages(['date' => 'Não há atendimento nesse dia da semana.']);
        }
        if (! in_array($dados['hora'], $config->horarios(), true)) {
            throw ValidationException::withMessages(['hora' => 'Esse horário está fora do expediente.']);
        }

        if (Carbon::parse($dados['date'])->gt(AgendaMatricula::limite())) {
            throw ValidationException::withMessages(['date' => 'A agenda só está aberta pelos próximos '.AgendaMatricula::MESES.' meses.']);
        }

        $dataHora = Carbon::parse("{$dados['date']} {$dados['hora']}");
        if ($dataHora->lte(now())) {
            throw ValidationException::withMessages(['hora' => 'Esse horário já passou.']);
        }
        if (Consulta::horarioOcupado($dataHora)) {
            throw ValidationException::withMessages(['hora' => 'Já existe uma consulta nesse horário.']);
        }

        $consulta = Consulta::create([
            'paciente_id' => $dados['patientId'],
            'data_hora_consulta' => $dataHora,
            'duracao_minutos' => $config->duracao_sessao,
            'modalidade' => $dados['tipo'] === 'Consulta online' ? 'online' : 'presencial',
            'status' => $dados['status'] === 'Confirmado' ? 'confirmado' : 'agendado',
            'valor' => $dados['valor'],
        ]);

        // Consulta avulsa: o valor vira uma cobrança em aberto no perfil do paciente (única, não recorrente).
        if ((float) $dados['valor'] > 0) {
            $consulta->cobranca()->create([
                'paciente_id' => $consulta->paciente_id,
                'titulo' => 'Consulta avulsa — '.$dataHora->format('d/m/Y'),
                'valor' => $dados['valor'],
                'vencimento' => $dataHora->toDateString(),
            ]);
        }

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
