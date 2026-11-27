<?php

namespace App\Services;

use App\Models\Cobranca;
use App\Models\Configuracao;
use App\Models\Contrato;
use App\Models\Matricula;
use App\Models\Paciente;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Regras do contrato (pacote de sessões):
 * - Um ciclo tem sessoes_pacote sessões, contadas pelos dias e horários do contrato a partir de ciclo_inicio.
 * - Cada ciclo gera uma cobrança (vence no início do ciclo). Terminado o ciclo, o contrato renova sozinho.
 * - Título vencido e não pago bloqueia o contrato: as sessões futuras saem da agenda e ele não renova.
 *   Quitado o atraso, o contrato volta a ficar ativo e a agenda é refeita.
 * - Encerrar o contrato tira as sessões futuras da agenda e cancela as cobranças futuras sem pagamento.
 */
class Contratos
{
    public function __construct(private AgendaMatricula $agenda) {}

    /**
     * @param  array{sessoes:int, valor:float, inicio:Carbon}  $dados
     * @param  array<int, array{weekday:int, time:string, tipo:string}>  $horarios
     */
    public function criar(Paciente $paciente, array $dados, array $horarios): Contrato
    {
        return DB::transaction(function () use ($paciente, $dados, $horarios) {
            $inicio = $dados['inicio']->copy()->startOfDay();

            $contrato = $paciente->contratos()->create([
                'sessoes_pacote' => $dados['sessoes'],
                'valor_pacote' => $dados['valor'],
                'data_inicio' => $inicio,
                'status' => 'ativo',
                'ciclo_atual' => 1,
                'ciclo_inicio' => $inicio,
            ]);

            foreach ($horarios as $h) {
                $this->novaMatricula($contrato, $h);
            }

            $this->recalcularFim($contrato);
            $this->lancarCobranca($contrato);
            $paciente->sincronizarStatus();

            // Quem já está devendo começa o contrato bloqueado; senão a agenda é gerada.
            $this->sincronizarInadimplencia($paciente->fresh());

            return $contrato->fresh();
        });
    }

    /** Cria um dia/horário fixo no contrato (sem gerar a agenda: quem chama decide). */
    public function novaMatricula(Contrato $contrato, array $h): Matricula
    {
        return $contrato->matriculas()->create([
            'paciente_id' => $contrato->paciente_id,
            'inicio_da_matricula' => today()->max($contrato->data_inicio),
            'dia_da_matricula' => Matricula::DIAS[(int) $h['weekday']],
            'horario_da_matricula' => $h['time'],
            'tipo_da_consulta' => $h['tipo'] === 'Consulta online' ? 'online' : 'presencial',
            'valor_sessao' => 0,
        ]);
    }

    /** Muda o tamanho e o valor do pacote. O ciclo atual é recalculado e a cobrança dele, se ainda sem pagamento, acompanha. */
    public function alterar(Contrato $contrato, int $sessoes, float $valor): void
    {
        DB::transaction(function () use ($contrato, $sessoes, $valor) {
            $contrato->update(['sessoes_pacote' => $sessoes, 'valor_pacote' => $valor]);
            $this->recalcularFim($contrato);

            $cobranca = $contrato->cobrancas()->where('ciclo', $contrato->ciclo_atual)->first();
            if ($cobranca && $cobranca->situacao === 'pendente' && ! $cobranca->pagamentos()->exists()) {
                $valor > 0
                    ? $cobranca->update(['valor' => $valor, 'titulo' => $this->tituloCobranca($contrato)])
                    : $cobranca->update(['situacao' => 'cancelado']);
            } elseif (! $cobranca) {
                $this->lancarCobranca($contrato);
            }
        });
    }

    /** Encerra o contrato. O histórico (sessões e cobranças pagas ou vencidas) continua. */
    public function encerrar(Contrato $contrato): void
    {
        if (! $contrato->aberto()) {
            return;
        }

        DB::transaction(function () use ($contrato) {
            foreach ($contrato->matriculas()->ativas()->get() as $matricula) {
                $this->agenda->limparFuturas($matricula);
                $matricula->update(['status_matricula' => 'encerrada', 'fim_da_matricula' => today()]);
            }

            $contrato->cobrancas()
                ->where('situacao', 'pendente')
                ->whereDoesntHave('pagamentos')
                ->whereDate('vencimento', '>=', today())
                ->update(['situacao' => 'cancelado']);

            $contrato->update(['status' => 'encerrado', 'encerrado_em' => today()]);
            $contrato->paciente->sincronizarStatus();
        });
    }

    /**
     * Data da última sessão de um ciclo que começa em $inicio: percorre os dias de atendimento contando as sessões
     * dos horários ativos do contrato até chegar ao tamanho do pacote. Null se o contrato não tem horário válido.
     */
    public function fimDoCiclo(Contrato $contrato, Carbon $inicio): ?Carbon
    {
        $porDia = $contrato->matriculas()->ativas()->get()->map->diaIso()->countBy();
        if ($porDia->isEmpty() || $contrato->sessoes_pacote < 1) {
            return null;
        }

        $config = Configuracao::atual();
        $dia = $inicio->copy()->startOfDay();
        $feitas = 0;

        // Limite de segurança: dez anos de calendário.
        for ($i = 0; $i < 3660; $i++, $dia->addDay()) {
            if (! $config->atendeNo($dia)) {
                continue;
            }
            $feitas += $porDia->get($dia->dayOfWeekIso, 0);
            if ($feitas >= $contrato->sessoes_pacote) {
                return $dia;
            }
        }

        return null;
    }

    public function recalcularFim(Contrato $contrato): void
    {
        $contrato->update(['ciclo_fim' => $this->fimDoCiclo($contrato, $contrato->ciclo_inicio)]);
    }

    /** Cobrança do ciclo atual (uma por ciclo; não recria se já existir, mesmo cancelada). */
    public function lancarCobranca(Contrato $contrato): ?Cobranca
    {
        if ((float) $contrato->valor_pacote <= 0) {
            return null;
        }

        return Cobranca::firstOrCreate(
            ['contrato_id' => $contrato->id, 'ciclo' => $contrato->ciclo_atual],
            [
                'paciente_id' => $contrato->paciente_id,
                'titulo' => $this->tituloCobranca($contrato),
                'valor' => $contrato->valor_pacote,
                'vencimento' => $contrato->ciclo_inicio->copy()->max(today())->toDateString(),
                'situacao' => 'pendente',
            ],
        );
    }

    /** Renova os ciclos que já terminaram (o contrato bloqueado não renova). Devolve quantas renovações fez. */
    public function renovar(Contrato $contrato): int
    {
        if ($contrato->status === 'ativo' && $contrato->ciclo_fim === null) {
            $this->recalcularFim($contrato);
        }

        $renovacoes = 0;
        while ($contrato->status === 'ativo' && $contrato->ciclo_fim !== null && $contrato->ciclo_fim->lt(today())) {
            $this->iniciarCiclo($contrato, $contrato->ciclo_fim->copy()->addDay());
            $renovacoes++;
        }

        return $renovacoes;
    }

    /**
     * Bloqueia o contrato de quem tem título vencido e desbloqueia o de quem quitou. Ao desbloquear, se o ciclo já
     * terminou enquanto estava bloqueado, um novo ciclo começa hoje. Devolve 'bloqueado', 'desbloqueado' ou null.
     */
    public function sincronizarInadimplencia(Paciente $paciente): ?string
    {
        $contrato = $paciente->contratoAberto();
        if (! $contrato) {
            $paciente->sincronizarStatus();

            return null;
        }

        $devendo = $paciente->inadimplente();
        $mudou = null;

        DB::transaction(function () use ($paciente, $contrato, $devendo, &$mudou) {
            if ($devendo && $contrato->status === 'ativo') {
                $contrato->update(['status' => 'bloqueado']);
                foreach ($contrato->matriculas()->ativas()->get() as $matricula) {
                    $this->agenda->limparFuturas($matricula);
                }
                $paciente->sincronizarStatus();
                $mudou = 'bloqueado';

                return;
            }

            if (! $devendo && $contrato->status === 'bloqueado') {
                $contrato->update(['status' => 'ativo']);
                if ($contrato->ciclo_fim !== null && $contrato->ciclo_fim->lt(today())) {
                    $this->iniciarCiclo($contrato, today());
                }
                $mudou = 'desbloqueado';
            }

            $paciente->sincronizarStatus();
            if ($contrato->status === 'ativo') {
                $this->gerarAgenda($contrato, $paciente);
            }
        });

        return $mudou;
    }

    /**
     * Rotina diária: primeiro acerta o bloqueio por inadimplência (quem deve não renova), depois renova os contratos
     * ativos. A mensalidade da renovação vence hoje, então não bloqueia ninguém no mesmo dia.
     */
    public function processar(): array
    {
        $resultado = ['renovados' => 0, 'bloqueados' => 0, 'desbloqueados' => 0];

        // Contratos vindos da migração (ou sem horário válido antes) ainda sem o fim do pacote calculado.
        foreach (Contrato::abertos()->whereNull('ciclo_fim')->get() as $contrato) {
            $this->recalcularFim($contrato);
        }

        $pacientes = Paciente::whereHas('contratos', fn ($q) => $q->abertos())->get();
        foreach ($pacientes as $paciente) {
            $mudou = $this->sincronizarInadimplencia($paciente);
            if ($mudou) {
                $resultado[$mudou === 'bloqueado' ? 'bloqueados' : 'desbloqueados']++;
            }
        }

        foreach (Contrato::where('status', 'ativo')->get() as $contrato) {
            $resultado['renovados'] += $this->renovar($contrato);
        }

        return $resultado;
    }

    /** Gera a agenda dos horários ativos do contrato (só acontece com o paciente ativo). */
    public function gerarAgenda(Contrato $contrato, ?Paciente $paciente = null): int
    {
        $paciente ??= $contrato->paciente()->first();
        $criadas = 0;
        foreach ($contrato->matriculas()->ativas()->get() as $matricula) {
            $criadas += $this->agenda->gerar($matricula->setRelation('paciente', $paciente));
        }

        return $criadas;
    }

    private function iniciarCiclo(Contrato $contrato, Carbon $inicio): void
    {
        $contrato->update([
            'ciclo_atual' => $contrato->ciclo_atual + 1,
            'ciclo_inicio' => $inicio->copy()->startOfDay(),
        ]);
        $this->recalcularFim($contrato);
        $this->lancarCobranca($contrato);
    }

    private function tituloCobranca(Contrato $contrato): string
    {
        return "Mensalidade — pacote {$contrato->ciclo_atual} ({$contrato->sessoes_pacote} sessões)";
    }
}
