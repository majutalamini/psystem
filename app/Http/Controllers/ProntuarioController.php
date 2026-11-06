<?php

namespace App\Http\Controllers;

use App\Actions\EdicaoClinica;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Models\RegistroAcao;
use App\Queries\PacientesDaPagina;
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
            'patientDirectory' => fn () => PacientesDaPagina::indiceClinico($request),
            'selectedPatient' => fn () => $selecionado ? PacientesDaPagina::perfil($selecionado) : null,
            'records' => fn () => $selecionado ? Prontuario::listaDoPaciente($selecionado) : [],
            'recordCounts' => fn () => Prontuario::selectRaw('paciente_id, count(*) as total')
                ->groupBy('paciente_id')
                ->pluck('total', 'paciente_id'),
        ]);
    }

    public function store(Request $request, Paciente $paciente)
    {
        $prontuario = $paciente->prontuarios()->create([
            ...$this->validar($request),
            'psicologo_id' => $request->user()->id,
        ]);
        RegistroAcao::registrar('prontuario.criar', $prontuario);

        return back();
    }

    public function update(Request $request, Prontuario $prontuario)
    {
        $dados = $this->validar($request);
        $versao = (int) $request->validate(['versao' => 'required|integer|min:1'])['versao'];

        EdicaoClinica::executar($prontuario, $versao, 'prontuário', fn (Prontuario $atual) => $atual->fill($dados));
        RegistroAcao::registrar('prontuario.editar', $prontuario);

        return back();
    }

    public function destroy(Prontuario $prontuario)
    {
        RegistroAcao::registrar('prontuario.excluir', $prontuario);
        $prontuario->delete();

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
