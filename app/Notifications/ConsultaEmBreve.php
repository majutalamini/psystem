<?php

namespace App\Notifications;

use App\Models\Consulta;
use App\Support\Tela;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Aviso para a psicóloga cerca de 1 hora antes de cada consulta. */
class ConsultaEmBreve extends Notification
{
    public function __construct(public Consulta $consulta) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $c = $this->consulta;
        $hora = $c->data_hora_consulta->format('H:i');

        return (new MailMessage)
            ->subject("Consulta às {$hora} — {$c->paciente->nome}")
            ->greeting("Olá, {$notifiable->nome}!")
            ->line("Sua próxima consulta é hoje, às **{$hora}**.")
            ->line("**Paciente:** {$c->paciente->nome}")
            ->line('**Tipo:** '.Tela::MODALIDADES[$c->modalidade])
            ->line('**Situação:** '.Consulta::STATUS[$c->status])
            ->line("**Telefone:** {$c->paciente->telefone}")
            ->action('Ver na agenda', url('/agenda?data='.$c->data_hora_consulta->toDateString()))
            ->salutation('Psystem');
    }
}
