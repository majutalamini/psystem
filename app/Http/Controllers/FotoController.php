<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Models\Psicologo;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/** Fotos ficam no disco privado e só saem por esta rota, para quem está logado. */
class FotoController extends Controller
{
    public const REGRA_UPLOAD = 'required|file|max:4096|mimes:jpg,jpeg,png,webp|mimetypes:image/jpeg,image/png,image/webp';

    public function paciente(Paciente $paciente): Response
    {
        return self::responder($paciente->foto);
    }

    public function psicologo(Psicologo $psicologo): Response
    {
        return self::responder($psicologo->foto);
    }

    /** URL autenticada da foto; o parâmetro muda quando a foto muda (cache do navegador). */
    public static function url(string $rota, int $id, ?string $caminho): ?string
    {
        return $caminho ? url("/{$rota}/{$id}/foto").'?v='.substr(hash('sha256', $caminho), 0, 12) : null;
    }

    private static function responder(?string $caminho): Response
    {
        abort_if(! $caminho || ! Storage::exists($caminho), 404);

        return Storage::response($caminho, null, [
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => 'inline',
        ]);
    }
}
