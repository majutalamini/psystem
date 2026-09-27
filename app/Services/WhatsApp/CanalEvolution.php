<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;

/**
 * Envio pela Evolution API, com o celular conectado por QR code (WhatsApp Web).
 * Não é a API oficial: o número pode ser bloqueado se enviar muito, por isso há pausa entre mensagens.
 * Aceita texto livre, então os textos de Configurações saem como estão (sem modelo).
 */
class CanalEvolution implements Canal
{
    public function __construct(private EvolutionApi $api) {}

    public function enviar(string $telefone, string $texto, ?array $modelo = null): array
    {
        // Sem celular conectado a Evolution trava até o tempo esgotar; melhor avisar logo.
        if (! $this->api->conectado()) {
            return ['situacao' => 'erro', 'erro' => 'WhatsApp não conectado: escaneie o QR code em Configurações › WhatsApp.'];
        }

        try {
            $resposta = $this->api->enviarTexto(ltrim($telefone, '+'), $texto);
        } catch (ConnectionException $e) {
            return ['situacao' => 'erro', 'erro' => 'A Evolution API não respondeu: '.$e->getMessage()];
        }

        if ($resposta->failed()) {
            return ['situacao' => 'erro', 'erro' => EvolutionApi::mensagemDeErro($resposta)];
        }

        return ['situacao' => 'enviada', 'id_externo' => $resposta->json('key.id')];
    }

    public function intervaloSegundos(): int
    {
        return (int) config('services.evolution.intervalo_segundos');
    }
}
