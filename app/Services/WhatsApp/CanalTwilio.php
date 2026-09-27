<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Envio pela API da Twilio (https://www.twilio.com/docs/whatsapp/api).
 * No teste só recebe quem mandou "join <código>" ao número da Twilio; mensagem iniciada pelo
 * consultório precisa de modelo (ContentSid), e texto livre só vale nas 24 horas depois da última mensagem da pessoa.
 */
class CanalTwilio implements Canal
{
    /** O que fazer nos erros mais comuns da Twilio, para aparecer junto do erro na lista de mensagens. */
    private const DICAS = [
        20003 => 'Account SID ou Auth Token errados no .env.',
        21211 => 'O número de destino é inválido.',
        21654 => 'A Twilio só aceita modelo aprovado para mensagem iniciada pelo consultório: preencha TWILIO_CONTENT_SID_LEMBRETE no .env (no teste da Twilio: HXb5b62575e6e4ff6129ad7c8efe1f983e). Texto livre só vale nas 24 horas depois que a pessoa manda mensagem.',
        63015 => 'Este número ainda não entrou no ambiente de teste (ou a conexão venceu): mande "join <código>" pelo WhatsApp para o número da Twilio (veja em Messaging › Try it out).',
        63016 => 'Fora da janela de 24 horas: a pessoa precisa mandar uma mensagem para o número da Twilio antes, ou o envio precisa usar um modelo aprovado.',
        572002 => 'Conta de teste: só recebe o número conectado em Messaging › Try it out › Send a WhatsApp message (um por vez).',
    ];

    public function enviar(string $telefone, string $texto, ?array $modelo = null): array
    {
        $config = config('services.twilio');
        if (empty($config['account_sid']) || empty($config['auth_token'])) {
            return ['situacao' => 'erro', 'erro' => 'Twilio não configurada: preencha TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN no .env.'];
        }

        $dados = ['From' => $config['whatsapp_from'], 'To' => "whatsapp:{$telefone}"];
        if ($modelo) {
            $dados['ContentSid'] = $modelo['sid'];
            $dados['ContentVariables'] = json_encode($modelo['variaveis'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            $dados['Body'] = $texto;
        }

        try {
            $resposta = Http::asForm()
                ->withBasicAuth($config['account_sid'], $config['auth_token'])
                ->timeout(15)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$config['account_sid']}/Messages.json", $dados);
        } catch (ConnectionException $e) {
            return ['situacao' => 'erro', 'erro' => 'Sem conexão com a Twilio: '.$e->getMessage()];
        }

        if ($resposta->failed()) {
            return ['situacao' => 'erro', 'erro' => $this->erro($resposta->json('code'), $resposta->json('message') ?? $resposta->body())];
        }

        // A Twilio aceita e depois entrega; falhas imediatas vêm com error_code na própria resposta.
        if ($resposta->json('error_code')) {
            return [
                'situacao' => 'erro',
                'id_externo' => $resposta->json('sid'),
                'erro' => $this->erro($resposta->json('error_code'), $resposta->json('error_message')),
            ];
        }

        return ['situacao' => 'enviada', 'id_externo' => $resposta->json('sid')];
    }

    public function intervaloSegundos(): int
    {
        return (int) config('services.twilio.intervalo_segundos');
    }

    private function erro(?int $codigo, ?string $mensagem): string
    {
        $texto = trim(($codigo ? "Erro {$codigo}: " : '').$mensagem);
        $dica = self::DICAS[$codigo] ?? null;

        return $dica ? "{$texto} — {$dica}" : $texto;
    }
}
