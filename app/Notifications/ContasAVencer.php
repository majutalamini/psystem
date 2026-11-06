<?php

namespace App\Notifications;

use App\Models\Cobranca;
use App\Models\Despesa;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

/** Resumo das contas a pagar e cobranças que vencem nos próximos dias. */
class ContasAVencer extends Notification implements ShouldQueue
{
    use Queueable;

    // Etapa 4: e-mail na fila do PostgreSQL, com tentativas limitadas; falha de SMTP não trava quem disparou.
    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [60, 300];

    /**
     * @param  Collection<Despesa>  $despesas
     * @param  Collection<Cobranca>  $cobrancas
     */
    public function __construct(public Collection $despesas, public Collection $cobrancas, public int $dias) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reais = fn ($v) => 'R$ '.number_format((float) $v, 2, ',', '.');
        $quando = fn ($data) => $data->isToday() ? 'vence hoje' : 'vence em '.$data->format('d/m');

        $mensagem = (new MailMessage)
            ->subject('Contas vencendo nos próximos dias')
            ->greeting("Olá, {$notifiable->nome}!")
            ->line("Estas contas vencem nos próximos {$this->dias} dias.");

        if ($this->despesas->isNotEmpty()) {
            $mensagem->line('**Contas a pagar do consultório**');
            foreach ($this->despesas as $d) {
                $mensagem->line("• {$d->descricao} — falta {$reais($d->saldo())} — {$quando($d->vencimento)}");
            }
        }

        if ($this->cobrancas->isNotEmpty()) {
            $mensagem->line('**Cobranças de pacientes**');
            foreach ($this->cobrancas as $c) {
                $mensagem->line("• {$c->paciente->nome} — {$c->titulo} — falta {$reais($c->saldo())} — {$quando($c->vencimento)}");
            }
        }

        return $mensagem
            ->action('Abrir o financeiro', url('/financeiro'))
            ->salutation('Psystem');
    }
}
