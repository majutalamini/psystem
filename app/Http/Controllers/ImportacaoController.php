<?php

namespace App\Http\Controllers;

use App\Models\AnamneseModelo;
use Inertia\Inertia;

/** Tela de importação de prontuários e anamneses (a leitura do .docx é feita no navegador; a gravação usa as rotas de prontuário, anamnese e documento). */
class ImportacaoController extends Controller
{
    public function index()
    {
        return Inertia::render('Importacoes/Importacoes', [
            'secoes' => AnamneseModelo::with('perguntas')->first()?->secoes() ?? [],
        ]);
    }
}
