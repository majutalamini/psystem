<?php

namespace App\Http\Controllers;

use App\Models\AnamneseModelo;
use App\Models\Importacao;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Tela de importação de prontuários e anamneses (a leitura do .docx é feita no navegador; a gravação usa as rotas de prontuário, anamnese e documento). */
class ImportacaoController extends Controller
{
    public function index()
    {
        return Inertia::render('Importacoes/Importacoes', [
            'secoes' => AnamneseModelo::with('perguntas')->first()?->secoes() ?? [],
            'historico' => Importacao::with('paciente')->latest('criado_em')->latest('id')->limit(100)->get()->map->paraTela(),
        ]);
    }

    /** Registra no histórico uma importação já gravada pelas rotas de prontuário/anamnese. */
    public function store(Request $request)
    {
        $dados = $request->validate([
            'patientId' => 'required|exists:pacientes,id',
            'tipo' => 'required|in:prontuario,anamnese',
            'arquivo' => 'required|string|max:255',
            'anexado' => 'boolean',
        ]);

        Importacao::create([
            'paciente_id' => $dados['patientId'],
            'tipo' => $dados['tipo'],
            'arquivo' => $dados['arquivo'],
            'anexado' => $dados['anexado'] ?? false,
        ]);

        return back();
    }
}
