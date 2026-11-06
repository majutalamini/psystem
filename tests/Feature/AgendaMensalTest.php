<?php

namespace Tests\Feature;

use App\Models\Consulta;
use Illuminate\Support\Carbon;

class AgendaMensalTest extends ConsultorioTestCase
{
    private function eventos(string $url): array
    {
        return collect($this->get($url)->assertOk()->viewData('page')['props']['events'])->sortBy('id')->values()->all();
    }

    public function test_uma_resposta_da_grade_mensal_equivale_a_uniao_das_semanas_visiveis(): void
    {
        $this->travelTo(Carbon::parse('2026-10-05 10:00:00'));
        $paciente = $this->paciente();
        foreach (['2026-10-26', '2026-11-05', '2026-12-04', '2026-12-07'] as $dia) {
            Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => $dia.' 08:50',
                'duracao_minutos' => 50, 'modalidade' => 'online', 'status' => 'agendado']);
        }
        Consulta::create(['paciente_id' => $paciente->id, 'data_hora_consulta' => '2026-11-06 08:50',
            'duracao_minutos' => 50, 'modalidade' => 'online', 'status' => 'cancelado']);

        $semanas = [];
        for ($semana = Carbon::parse('2026-10-26'); $semana->lte('2026-11-30'); $semana->addWeek()) {
            $semanas = [...$semanas, ...$this->eventos('/agenda?visao=semana&data='.$semana->toDateString())];
        }
        $esperados = collect($semanas)->unique('id')->sortBy('id')->values()->all();
        $mensal = $this->eventos('/agenda?data=2026-11-05&visao=mes&grade=1');
        $this->assertSame($esperados, $mensal);
        $this->assertCount(3, $mensal);
        $this->assertSame(['2026-10-26', '2026-11-05', '2026-12-04'], array_column($mensal, 'isoDate'));
        // Consumidores do contrato mensal anterior continuam recebendo só o mês.
        $this->assertSame(['2026-11-05'], array_column($this->eventos('/agenda?data=2026-11-05&visao=mes'), 'isoDate'));
    }

    public function test_grade_mensal_nao_grava_consultas(): void
    {
        $paciente = $this->paciente();
        $this->matricular($paciente, weekday: 0)->assertSessionHasNoErrors();
        $this->assertSame(8, Consulta::count()); // só 05/10 cabe na janela de 14 dias
        $antes = $this->eventos('/agenda?data=2026-10-05&visao=mes');
        $quantidade = Consulta::count();
        $this->assertSame(8, $quantidade); // abrir o mês não grava as segundas seguintes
        $grade = $this->eventos('/agenda?data=2026-10-05&visao=mes&grade=1');
        $this->assertSame($quantidade, Consulta::count());
        $this->assertSame($antes, array_values(array_filter($grade, fn ($evento) => str_starts_with($evento['isoDate'], '2026-10'))));
        $this->assertSame($grade, $this->eventos('/agenda?data=2026-10-05&visao=mes&grade=1'));
        $this->assertSame($quantidade, Consulta::count());
    }
}
