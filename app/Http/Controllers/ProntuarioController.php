<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Models\Prontuario;
use App\Support\Tela;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProntuarioController extends Controller
{
    public function index(Request $request)
    {
        $selecionado = $request->integer('paciente') ?: Paciente::orderBy('nome')->value('id');

        return Inertia::render('Prontuarios/Prontuarios', [
            'selectedId' => $selecionado,
            'records' => $selecionado ? Prontuario::listaDoPaciente($selecionado) : [],
            'recordCounts' => Prontuario::selectRaw('paciente_id, count(*) as total')
                ->groupBy('paciente_id')
                ->pluck('total', 'paciente_id'),
        ]);
    }

    public function store(Request $request, Paciente $paciente)
    {
        $paciente->prontuarios()->create([
            ...$this->validar($request),
            'psicologo_id' => $request->user()->id,
        ]);

        return back();
    }

    public function update(Request $request, Prontuario $prontuario)
    {
        $prontuario->update($this->validar($request));

        return back();
    }

    private function validar(Request $request): array
    {
        $dados = $request->validate([
            'date' => 'required|date_format:d/m/Y',
            'tecnicas' => 'nullable|string',
            'objetivo' => 'nullable|string',
            'descricao' => 'required|string',
        ], [], ['date' => 'data', 'descricao' => 'descrição']);

        return [
            'data_atendimento' => Tela::lerData($dados['date']),
            'tecnicas' => $dados['tecnicas'] ?? null,
            'objetivo' => $dados['objetivo'] ?? null,
            'observacoes_consulta' => $dados['descricao'],
        ];
    }
}
