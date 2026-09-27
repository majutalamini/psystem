<?php

namespace Tests\Feature;

use App\Models\Configuracao;
use App\Models\Consulta;
use App\Models\Paciente;
use App\Models\Psicologo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Base dos testes: psicóloga logada, expediente padrão e o relógio parado
 * numa segunda-feira, 28/09/2026 às 10:00 (fuso America/Sao_Paulo).
 */
abstract class ConsultorioTestCase extends TestCase
{
    use RefreshDatabase;

    protected Psicologo $psicologa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->travelTo(Carbon::parse('2026-09-28 10:00:00'));

        Configuracao::atual();
        $this->psicologa = Psicologo::create([
            'nome' => 'Dra. Teste',
            'crp' => '12/00001',
            'email' => 'teste@psystem.com',
            'senha_hash' => 'segredo123',
        ]);
        $this->actingAs($this->psicologa);
    }

    protected function paciente(array $dados = []): Paciente
    {
        static $cpf = 10000000000;

        return Paciente::create([
            'nome' => 'Paciente Teste',
            'cpf' => (string) $cpf++,
            'telefone' => '(48) 99999-0000',
            'data_nascimento' => '1990-01-01',
            'status_paciente' => 'ativo',
            ...$dados,
        ]);
    }

    /** Salva a matrícula pela rota, como a tela faz. weekday: 0 = segunda ... 6 = domingo. */
    protected function matricular(Paciente $paciente, int $weekday, string $time = '09:00', float $valor = 200)
    {
        return $this->from("/pacientes/{$paciente->id}")->put("/pacientes/{$paciente->id}/matricula", [
            'weekday' => $weekday,
            'time' => $time,
            'tipo' => 'Consulta presencial',
            'valor' => $valor,
        ]);
    }

    /** Datas e horas das consultas do paciente, em ordem, no formato "AAAA-MM-DD HH:MM". */
    protected function horarios(Paciente $paciente, ?string $status = null): array
    {
        return Consulta::where('paciente_id', $paciente->id)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderBy('data_hora_consulta')
            ->get()
            ->map(fn ($c) => $c->data_hora_consulta->format('Y-m-d H:i'))
            ->all();
    }
}
