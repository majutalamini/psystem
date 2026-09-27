<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\MensagemWhatsapp;
use App\Models\Paciente;
use App\Services\WhatsApp\Canal;
use App\Services\WhatsApp\CanalTwilio;
use Illuminate\Support\Carbon;
use Illuminate\Support\Sleep;

/**
 * Envio automático pelo WhatsApp para os pacientes: lembrete de sessão e cobrança perto do vencimento.
 * Só vai para paciente ativo que aceitou receber mensagens, e só com o "Envio automático" ligado em Configurações.
 * Cada consulta e cada cobrança recebe uma mensagem só (as que deram erro podem ser tentadas de novo).
 */
class AvisosWhatsapp
{
    public const DIAS_ANTES_DO_LEMBRETE = 1;

    private bool $primeiro = true;

    public function __construct(private Canal $canal) {}

    /** Lembrete das consultas de amanhã, com o texto "lembrete" de Configurações. */
    public function lembretes(): int
    {
        $config = Configuracao::atual();
        if (! $config->whatsapp_ativo || ! $config->mensagem_lembrete) {
            return 0;
        }

        $dia = today()->addDays(self::DIAS_ANTES_DO_LEMBRETE);
        $consultas = Consulta::with('paciente')
            ->whereIn('status', ['agendado', 'confirmado'])
            ->whereBetween('data_hora_consulta', [$dia->copy()->startOfDay(), $dia->copy()->endOfDay()])
            ->whereHas('paciente', fn ($q) => $q->where('aceita_whatsapp', true)->where('status_paciente', 'ativo'))
            ->whereNotIn('id', $this->jaEnviadas('agenda_id'))
            ->orderBy('data_hora_consulta')
            ->get();

        foreach ($consultas as $consulta) {
            $data = $consulta->data_hora_consulta;
            $texto = $this->preencher($config->mensagem_lembrete, $consulta->paciente, [
                '{data}' => $data->format('d/m/Y'),
                '{hora}' => $data->format('H:i'),
            ]);

            $this->enviar($consulta->paciente, 'lembrete', $texto, ['agenda_id' => $consulta->id], $this->modeloLembrete($data));
        }

        return $consultas->count();
    }

    /** Cobranças em aberto que vencem daqui a "dias antes" (Configurações), com o texto "cobrança". */
    public function cobrancas(): int
    {
        $config = Configuracao::atual();
        if (! $config->whatsapp_ativo || ! $config->mensagem_cobranca) {
            return 0;
        }

        $dia = today()->addDays($config->whatsapp_dias_antes);
        $cobrancas = Cobranca::with(['paciente', 'pagamentos'])
            ->where('situacao', 'pendente')
            ->whereBetween('vencimento', [$dia->copy()->startOfDay(), $dia->copy()->endOfDay()])
            ->whereHas('paciente', fn ($q) => $q->where('aceita_whatsapp', true)->where('status_paciente', 'ativo'))
            ->whereNotIn('id', $this->jaEnviadas('cobranca_id'))
            ->orderBy('vencimento')
            ->get();

        foreach ($cobrancas as $cobranca) {
            $texto = $this->preencher($config->mensagem_cobranca, $cobranca->paciente, [
                '{referencia}' => $cobranca->titulo,
                '{valor}' => 'R$ '.number_format($cobranca->saldo(), 2, ',', '.'),
                '{vencimento}' => $cobranca->vencimento->format('d/m/Y'),
            ]);
            $this->enviar($cobranca->paciente, 'cobranca', $texto, ['cobranca_id' => $cobranca->id]);
        }

        return $cobrancas->count();
    }

    /** Mensagem escrita pela psicóloga no atalho do WhatsApp (não depende do "Envio automático"). */
    public function manual(Paciente $paciente, string $tipo, string $texto): MensagemWhatsapp
    {
        return $this->enviar($paciente, $tipo, $texto, []);
    }

    /**
     * Mensagem avulsa para conferir se o envio está funcionando (botão em Configurações).
     * Com modelo de lembrete configurado, o teste usa o modelo (a Twilio recusa texto livre iniciado pela empresa).
     */
    public function teste(string $telefone): MensagemWhatsapp
    {
        return $this->enviar(null, 'teste', 'Mensagem de teste do Psystem: se você recebeu, o envio pelo WhatsApp está funcionando.', [], $this->modeloLembrete(now()->addHour()), $telefone);
    }

    /** Na Twilio, mensagem iniciada pelo consultório precisa de modelo aprovado (ContentSid "HX..."). */
    private function modeloLembrete(Carbon $quando): ?array
    {
        $sid = config('services.twilio.content_sid_lembrete');

        return $sid && $this->canal instanceof CanalTwilio
            ? ['sid' => $sid, 'variaveis' => ['1' => $quando->format('d/m'), '2' => $quando->format('H:i')]]
            : null;
    }

    /** "(48) 99999-0000" → "+5548999990000". Sem DDI, assume Brasil. */
    public static function telefoneE164(?string $telefone): ?string
    {
        $digitos = preg_replace('/\D/', '', (string) $telefone);
        if ($digitos === '') {
            return null;
        }

        return '+'.(str_starts_with($digitos, '55') && strlen($digitos) >= 12 ? $digitos : "55{$digitos}");
    }

    private function enviar(?Paciente $paciente, string $tipo, string $texto, array $referencias, ?array $modelo = null, ?string $telefone = null): MensagemWhatsapp
    {
        $numero = self::telefoneE164($telefone ?? $paciente?->telefone);
        $resultado = ['situacao' => 'erro', 'erro' => 'Telefone vazio ou inválido.'];

        if ($numero) {
            $this->pausar();
            $resultado = $this->canal->enviar($numero, $texto, $modelo);
        }

        return MensagemWhatsapp::create([
            ...$referencias,
            'paciente_id' => $paciente?->id,
            'tipo' => $tipo,
            'telefone' => $numero ?? (string) ($telefone ?? $paciente?->telefone),
            'texto' => $modelo ? "Modelo {$modelo['sid']} com ".json_encode($modelo['variaveis'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $texto,
            'situacao' => $resultado['situacao'],
            'id_externo' => $resultado['id_externo'] ?? null,
            'erro' => $resultado['erro'] ?? null,
        ]);
    }

    /** Intervalo entre mensagens (limite da Twilio; na Evolution, para não parecer envio em massa). */
    private function pausar(): void
    {
        if (! $this->primeiro && $this->canal->intervaloSegundos() > 0) {
            Sleep::for($this->canal->intervaloSegundos())->seconds();
        }
        $this->primeiro = false;
    }

    private function jaEnviadas(string $coluna)
    {
        return MensagemWhatsapp::whereNotNull($coluna)->where('situacao', '!=', 'erro')->select($coluna);
    }

    /** Mesmas variáveis do atalho do WhatsApp no front (utils/whatsapp.js). */
    private function preencher(string $modelo, Paciente $paciente, array $extras): string
    {
        $ultima = $paciente->consultas()->where('status', 'realizado')->max('data_hora_consulta');
        $valores = [
            '{paciente}' => explode(' ', trim($paciente->nome))[0],
            '{ultimaSessao}' => $ultima ? Carbon::parse($ultima)->format('d/m/Y') : '—',
            ...$extras,
        ];

        return strtr($modelo, $valores);
    }
}
