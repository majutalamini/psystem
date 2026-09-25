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

    /** Arquivos ficam no disco privado; só a psicóloga logada consegue abrir. */
    public function show(Documento $documento)
    {
        return Storage::response($documento->caminho, $documento->nome_arquivo);
    }

    public function destroy(Documento $documento)
    {
        Storage::delete($documento->caminho);
        $documento->delete();

        return back();
    }
}
