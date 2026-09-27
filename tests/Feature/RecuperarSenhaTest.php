<?php

namespace Tests\Feature;

use App\Notifications\RedefinirSenha;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

class RecuperarSenhaTest extends ConsultorioTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Auth::logout();
        Notification::fake();
    }

    public function test_telas_de_recuperacao_abrem(): void
    {
        $this->get('/esqueci-senha')->assertOk();
        $this->get('/redefinir-senha/qualquer?email=teste@psystem.com')->assertOk();
    }

    public function test_link_por_email_e_nova_senha(): void
    {
        $this->post('/esqueci-senha', ['email' => 'teste@psystem.com'])->assertSessionHas('aviso');

        $token = null;
        Notification::assertSentTo($this->psicologa, RedefinirSenha::class, function (RedefinirSenha $n) use (&$token) {
            $token = $n->token;
            $email = $n->toMail($this->psicologa);

            return $email->subject === 'Redefinir sua senha do Psystem'
                && str_contains($email->actionUrl, "/redefinir-senha/{$n->token}");
        });

        $this->post('/redefinir-senha', [
            'token' => $token,
            'email' => 'teste@psystem.com',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertRedirect('/login')->assertSessionHas('aviso');

        $this->post('/login', ['email' => 'teste@psystem.com', 'password' => 'segredo123'])->assertSessionHasErrors('email');
        $this->post('/login', ['email' => 'teste@psystem.com', 'password' => 'novaSenha123'])->assertRedirect('/');
    }

    public function test_email_desconhecido_recebe_a_mesma_resposta_e_nada_e_enviado(): void
    {
        $this->post('/esqueci-senha', ['email' => 'ninguem@psystem.com'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('aviso');

        Notification::assertNothingSent();
    }

    public function test_token_invalido_e_recusado(): void
    {
        $this->post('/redefinir-senha', [
            'token' => 'invalido',
            'email' => 'teste@psystem.com',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertSessionHasErrors('email');

        $this->post('/login', ['email' => 'teste@psystem.com', 'password' => 'segredo123'])->assertRedirect('/');
    }
}
