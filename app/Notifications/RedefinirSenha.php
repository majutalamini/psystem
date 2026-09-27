<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Link para criar uma nova senha (substitui o e-mail padrão do Laravel, em inglês). */
class RedefinirSenha extends Notification
{
    public function __construct(public string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('password.reset', ['token' => $this->token, 'email' => $notifiable->email]);
        $minutos = config('auth.passwords.users.expire');

        return (new MailMessage)
            ->subject('Redefinir sua senha do Psystem')
            ->greeting("Olá, {$notifiable->nome}!")
            ->line('Recebemos um pedido para redefinir a senha da sua conta.')
            ->action('Criar nova senha', $url)
            ->line("Este link vale por {$minutos} minutos.")
            ->line('Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.')
            ->salutation('Psystem');
    }
}
