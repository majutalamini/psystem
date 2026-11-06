<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\Paciente;
use App\Models\RegistroAcao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentoController extends Controller
{
    private const TIPOS = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png', 'image/webp',
    ];

    public function store(Request $request, Paciente $paciente)
    {
        // Tipo conferido pelo conteúdo (mimes/mimetypes) e pela extensão: HTML, SVG e executáveis não entram.
        $tipos = 'Envie PDF, DOCX, JPEG, PNG ou WebP.';
        $request->validate([
            'title' => 'required|string|max:150',
            'file' => 'required|file|max:20480|mimes:pdf,docx,jpg,jpeg,png,webp|extensions:pdf,docx,jpg,jpeg,png,webp|mimetypes:'.implode(',', self::TIPOS),
        ], [
            'file.mimes' => $tipos, 'file.extensions' => $tipos, 'file.mimetypes' => $tipos,
        ], ['title' => 'título', 'file' => 'arquivo']);

        $arquivo = $request->file('file');

        $documento = $paciente->documentos()->create([
            'titulo' => $request->input('title'),
            'nome_arquivo' => $arquivo->getClientOriginalName(),
            'caminho' => $arquivo->store("documentos/{$paciente->id}"),
            'tamanho' => $arquivo->getSize(),
        ]);
        RegistroAcao::registrar('documento.anexar', $documento);

        return back();
    }

    /**
     * Arquivos ficam no disco privado; só a psicóloga logada consegue abrir.
     * Sem parâmetro o arquivo é só exibido no navegador (inline); com ?baixar=1 vira download.
     */
    public function show(Request $request, Documento $documento)
    {
        abort_unless(Storage::exists($documento->caminho), 404);
        if ($request->boolean('baixar')) {
            return Storage::download($documento->caminho, $documento->nome_arquivo, ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
        }

        return Storage::response($documento->caminho, $documento->nome_arquivo, ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store', 'Content-Security-Policy' => "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'"], 'inline');
    }

    public function destroy(Documento $documento)
    {
        RegistroAcao::registrar('documento.excluir', $documento);
        Storage::delete($documento->caminho);
        $documento->delete();

        return back();
    }
}
