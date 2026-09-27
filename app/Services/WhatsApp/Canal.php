<?php

namespace App\Services\WhatsApp;

/** Última etapa do envio: o resto do sistema não sabe se a mensagem sai de verdade ou só é registrada. */
interface Canal
{
    /**
     * @param  string  $telefone  número em E.164, ex.: +5548999990000
     * @param  array|null  $modelo  ['sid' => 'HX...', 'variaveis' => ['1' => ..., '2' => ...]] para usar um modelo aprovado
     * @return array{situacao: string, id_externo?: ?string, erro?: ?string}
     */
    public function enviar(string $telefone, string $texto, ?array $modelo = null): array;

    /** Pausa entre uma mensagem e a próxima, em segundos. */
    public function intervaloSegundos(): int;
}
