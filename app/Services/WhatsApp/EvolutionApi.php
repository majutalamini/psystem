<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Conversa com a Evolution API (serviço "evolution" do Docker Compose, v2.3).
 * Uma instância só ("psystem"), ligada ao celular que escaneou o QR code.
 */
class EvolutionApi
{
    private function http(int $timeout = 10): PendingRequest
    {
        return Http::baseUrl(rtrim(config('services.evolution.url'), '/'))
            ->withHeaders(['apikey' => (string) config('services.evolution.api_key')])
            ->acceptJson()
            ->timeout($timeout);
    }

    private function instancia(): string
    {
        return config('services.evolution.instancia');
    }

    /**
     * Situação da conexão com o celular. Cria a instância na primeira vez.
     *
     * @return array{estado: string, qr: ?string, erro: ?string}  estado: open, connecting, close ou erro
     */
    public function conexao(): array
    {
        try {
            $estado = $this->http()->get("/instance/connectionState/{$this->instancia()}");

            if ($estado->status() === 404) {
                $criada = $this->http(20)->post('/instance/create', [
                    'instanceName' => $this->instancia(),
                    'integration' => 'WHATSAPP-BAILEYS',
                    'qrcode' => true,
                ]);
                if ($criada->failed()) {
                    return $this->falha($criada);
                }

                return ['estado' => 'connecting', 'qr' => $criada->json('qrcode.base64'), 'erro' => null];
            }
            if ($estado->failed()) {
                return $this->falha($estado);
            }

            if ($estado->json('instance.state') === 'open') {
                return ['estado' => 'open', 'qr' => null, 'erro' => null];
            }

            // Desconectado: pede um QR code novo (ele vale por uns 40 segundos).
            $qr = $this->http(20)->get("/instance/connect/{$this->instancia()}");

            return ['estado' => $estado->json('instance.state') ?? 'close', 'qr' => $qr->json('base64'), 'erro' => null];
        } catch (ConnectionException) {
            return ['estado' => 'erro', 'qr' => null, 'erro' => 'A Evolution API não respondeu. Confira se o container está rodando: docker compose up -d evolution'];
        }
    }

    public function conectado(): bool
    {
        try {
            return $this->http(5)->get("/instance/connectionState/{$this->instancia()}")->json('instance.state') === 'open';
        } catch (ConnectionException) {
            return false;
        }
    }

    /** Desliga o celular do sistema (ele some de "Aparelhos conectados" no WhatsApp). */
    public function desconectar(): void
    {
        try {
            $this->http()->delete("/instance/logout/{$this->instancia()}");
        } catch (ConnectionException) {
            // Se a Evolution está fora do ar, não há conexão para desfazer.
        }
    }

    /** @return Response */
    public function enviarTexto(string $numero, string $texto): Response
    {
        return $this->http(30)->post("/message/sendText/{$this->instancia()}", ['number' => $numero, 'text' => $texto]);
    }

    /** Mensagem de erro legível a partir da resposta da Evolution. */
    public function falha(Response $resposta): array
    {
        return ['estado' => 'erro', 'qr' => null, 'erro' => self::mensagemDeErro($resposta)];
    }

    public static function mensagemDeErro(Response $resposta): string
    {
        if ($resposta->status() === 401) {
            return 'Chave da Evolution errada: EVOLUTION_API_KEY do .env tem que ser a mesma do container.';
        }

        $mensagens = collect($resposta->json('response.message') ?? [$resposta->json('message') ?? $resposta->body()])
            ->map(fn ($m) => is_array($m) && array_key_exists('exists', $m) && ! $m['exists']
                ? "O número {$m['number']} não tem WhatsApp."
                : (is_array($m) ? json_encode($m, JSON_UNESCAPED_UNICODE) : (string) $m));

        return "Erro {$resposta->status()} da Evolution: ".$mensagens->implode(' ');
    }
}
