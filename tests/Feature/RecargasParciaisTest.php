<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;

class RecargasParciaisTest extends ConsultorioTestCase
{
    public function test_recarga_de_documentos_nao_consulta_prontuarios_anamneses_nem_cobrancas(): void
    {
        $paciente = $this->paciente();
        $version = $this->get('/pacientes/'.$paciente->id)->viewData('page')['version'];
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $response = $this->get('/pacientes/'.$paciente->id, [
            'X-Inertia' => 'true', 'X-Inertia-Partial-Component' => 'Pacientes/PatientProfile',
            'X-Inertia-Partial-Data' => 'documents,errors,flash',
            'X-Inertia-Version' => $version,
        ])->assertOk();
        $props = $response->json('props');
        $this->assertArrayHasKey('documents', $props);
        foreach (['patient', 'records', 'anamnese', 'receivables', 'hours', 'enrollmentReservations'] as $reused) {
            $this->assertArrayNotHasKey($reused, $props);
        }
        foreach ($queries as $sql) {
            foreach (['prontuarios', 'anamneses', 'cobrancas'] as $excluded) {
                $this->assertStringNotContainsString('"'.$excluded.'"', $sql);
            }
        }
    }

    public function test_recarga_de_prontuario_mantem_contagem_e_nao_recalcula_diretorio(): void
    {
        $paciente = $this->paciente();
        $version = $this->get('/prontuarios?paciente='.$paciente->id)->viewData('page')['version'];
        $response = $this->get('/prontuarios?paciente='.$paciente->id, [
            'X-Inertia' => 'true', 'X-Inertia-Partial-Component' => 'Prontuarios/Prontuarios',
            'X-Inertia-Partial-Data' => 'records,recordCounts,errors,flash',
            'X-Inertia-Version' => $version,
        ])->assertOk();
        $this->assertSame([], $response->json('props.records'));
        $this->assertArrayHasKey('recordCounts', $response->json('props'));
        $this->assertArrayNotHasKey('patientDirectory', $response->json('props'));
        $this->assertArrayNotHasKey('selectedPatient', $response->json('props'));
    }
}
