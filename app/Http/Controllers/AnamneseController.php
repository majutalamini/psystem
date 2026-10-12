<?php

namespace App\Http\Controllers;

use App\Models\Anamnese;
use App\Models\AnamneseModelo;
use App\Models\Paciente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AnamneseController extends Controller
{
    /** Lista de pacientes à esquerda e as anamneses do paciente escolhido (?paciente=id), como em Prontuários. */
    public function index(Request $request)
    {
        $selecionado = $request->integer('paciente') ?: Paciente::orderBy('nome')->value('id');

        return Inertia::render('Anamneses/Anamneses', [
            'selectedId' => $selecionado,
            'anamnese' => [
                'secoes' => AnamneseModelo::with('perguntas')->first()?->secoes() ?? [],
                'lista' => $selecionado ? Anamnese::listaDoPaciente($selecionado) : [],
            ],
            'anamneseCounts' => Anamnese::selectRaw('paciente_id, count(*) as total')
                ->groupBy('paciente_id')
                ->pluck('total', 'paciente_id'),
        ]);
    }

    /** Cria uma anamnese nova; as que o paciente já tem ficam como estão. */
    public function store(Request $request, Paciente $paciente)
    {
        [$titulo, $respostas] = $this->validar($request);

        DB::transaction(function () use ($paciente, $titulo, $respostas, $request) {
            $anamnese = $paciente->anamneses()->create(['titulo' => $titulo, 'psicologo_id' => $request->user()->id]);
            $anamnese->gravarRespostas($respostas, $request->user()->id);
        });

        return back();
    }

    public function update(Request $request, Anamnese $anamnese)
    {
        [$titulo, $respostas] = $this->validar($request);

        DB::transaction(function () use ($anamnese, $titulo, $respostas, $request) {
            $anamnese->update(['titulo' => $titulo]);
            $anamnese->gravarRespostas($respostas, $request->user()->id);
        });

        return back();
    }

    public function destroy(Anamnese $anamnese)
    {
        $anamnese->delete();

        return back();
    }

    private function validar(Request $request): array
    {
        $dados = $request->validate([
            'titulo' => 'nullable|string|max:150',
            'respostas' => 'array',
        ]);

        $respostas = $dados['respostas'] ?? [];
        if (collect($respostas)->every(fn ($v) => trim((string) $v) === '')) {
            throw ValidationException::withMessages(['respostas' => 'Preencha ao menos uma resposta.']);
        }

        return [trim($dados['titulo'] ?? '') ?: null, $respostas];
    }
}
