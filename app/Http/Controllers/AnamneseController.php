<?php

namespace App\Http\Controllers;

use App\Models\AnamnesePergunta;
use App\Models\Paciente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnamneseController extends Controller
{
    /** Uma anamnese por paciente: salvar substitui todas as respostas anteriores. */
    public function update(Request $request, Paciente $paciente)
    {
        $respostas = collect($request->validate(['respostas' => 'array'])['respostas'] ?? [])
            ->map(fn ($valor) => trim((string) $valor))
            ->filter(fn ($valor) => $valor !== '');

        $perguntasValidas = AnamnesePergunta::whereIn('id', $respostas->keys())->pluck('id');

        DB::transaction(function () use ($paciente, $respostas, $perguntasValidas, $request) {
            $paciente->respostasAnamnese()->delete();

            foreach ($perguntasValidas as $perguntaId) {
                $paciente->respostasAnamnese()->create([
                    'psicologo_id' => $request->user()->id,
                    'pergunta_id' => $perguntaId,
                    'valor_resposta' => $respostas[$perguntaId],
                ]);
            }
        });

        return back();
    }
}
