<?php

namespace App\Services\WhatsApp;

/** Modo de desenvolvimento: nada sai do sistema, a mensagem só fica registrada como "simulada". */
class CanalTeste implements Canal
{
    public function enviar(string $telefone, string $texto, ?array $modelo = null): array
    {
        return ['situacao' => 'simulada'];
    }

    public function intervaloSegundos(): int
    {
        return 0;
    }
}
