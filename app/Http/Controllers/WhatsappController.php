<?php

namespace App\Http\Controllers;

use App\Models\Paciente;
use App\Services\AvisosWhatsapp;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Mensagem escrita pela psicóloga (atalho do WhatsApp), enviada pelo número conectado ao sistema. */
class WhatsappController extends Controller
{
    public function enviar(Request $request, AvisosWhatsapp $whatsapp)
    {
        $dados = $request->validate([
            'patientId' => 'required|exists:pacientes,id',
            'tipo' => 'required|in:lembrete,retorno,cobranca,livre',
            'texto' => 'required|string|max:4000',
        ], [], ['texto' => 'mensagem']);

        $mensagem = $whatsapp->manual(Paciente::findOrFail($dados['patientId']), $dados['tipo'], $dados['texto']);
        if ($mensagem->situacao === 'erro') {
            throw ValidationException::withMessages(['texto' => $mensagem->erro]);
        }

        return back()->with('aviso_whatsapp', $mensagem->situacao === 'simulada'
            ? 'Mensagem registrada (modo teste: nada foi enviado).'
            : 'Mensagem enviada pelo WhatsApp.');
    }
}
