<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\Paciente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentoController extends Controller
{
    public function store(Request $request, Paciente $paciente)
    {
        $request->validate([
            'title' => 'required|string|max:150',
            'file' => 'required|file|max:20480',
        ], [], ['title' => 'título', 'file' => 'arquivo']);

        $arquivo = $request->file('file');

        $paciente->documentos()->create([
            'titulo' => $request->input('title'),
            'nome_arquivo' => $arquivo->getClientOriginalName(),
            'caminho' => $arquivo->store("documentos/{$paciente->id}"),
            'tamanho' => $arquivo->getSize(),
        ]);

        return back();
    }

    /**
     * Arquivos ficam no disco privado; só a psicóloga logada consegue abrir.
     * Sem parâmetro o arquivo é só exibido no navegador (inline); com ?baixar=1 vira download.
     */
    public function show(Request $request, Documento $documento)
    {
        if ($request->boolean('baixar')) {
            return Storage::download($documento->caminho, $documento->nome_arquivo);
        }

        return Storage::response($documento->caminho, $documento->nome_arquivo, ['X-Content-Type-Options' => 'nosniff'], 'inline');
    }

    public function destroy(Documento $documento)
    {
        Storage::delete($documento->caminho);
        $documento->delete();

        return back();
    }
}
