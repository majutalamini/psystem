<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Verificações operacionais (etapa 4). Cada uma devolve ok/falha e um detalhe curto, sem dados de pacientes.
 * Banco e armazenamento decidem a prontidão (HTTP 503); scheduler, fila e backup são alertas.
 */
class Prontidao
{
    public const BATIMENTO_SCHEDULER = 'operacao:scheduler:batimento';

    /** Gravado pelo serviço "backup" (docker/backup/backup.sh) no disco privado. */
    public const ARQUIVO_BACKUP = 'backup/ultimo-backup.json';

    /** @return array<string, array{ok: bool, critico: bool, detalhe: string}> */
    public static function verificar(): array
    {
        return [
            'banco' => self::tentar(true, function () {
                DB::select('select 1');

                return 'respondendo';
            }),
            'armazenamento' => self::tentar(true, function () {
                $arquivo = 'operacao/prontidao-'.Str::random(8);
                Storage::put($arquivo, 'ok');
                Storage::delete($arquivo);

                return 'gravando';
            }),
            'scheduler' => self::tentar(false, function () {
                $batimento = Cache::get(self::BATIMENTO_SCHEDULER);
                $atraso = $batimento ? (int) round(Carbon::parse($batimento)->diffInMinutes(now())) : null;
                if ($atraso === null || $atraso > 5) {
                    throw new \RuntimeException($atraso === null ? 'sem batimento' : "último batimento há {$atraso} min");
                }

                return "batimento há {$atraso} min";
            }),
            'fila' => self::tentar(false, function () {
                $falhas = DB::table('failed_jobs')->count();
                $antiga = DB::table('jobs')->min('available_at');
                $espera = $antiga ? (int) round((time() - $antiga) / 60) : 0;
                if ($falhas > 0 || $espera > 15) {
                    throw new \RuntimeException("{$falhas} falha(s), mais antiga esperando {$espera} min");
                }

                return 'sem falhas';
            }),
            'backup' => self::tentar(false, function () {
                $info = Storage::exists(self::ARQUIVO_BACKUP) ? json_decode(Storage::get(self::ARQUIVO_BACKUP), true) : null;
                $horas = isset($info['concluido_em']) ? (int) round(Carbon::parse($info['concluido_em'])->diffInHours(now())) : null;
                if ($horas === null || $horas > 26) {
                    throw new \RuntimeException($horas === null ? 'nenhum backup registrado' : "último backup há {$horas} h");
                }
                if (! ($info['externo'] ?? false)) {
                    throw new \RuntimeException("último backup há {$horas} h, mas sem cópia externa configurada");
                }

                return "último backup há {$horas} h, com cópia externa";
            }),
        ];
    }

    private static function tentar(bool $critico, callable $verificacao): array
    {
        try {
            return ['ok' => true, 'critico' => $critico, 'detalhe' => $verificacao()];
        } catch (Throwable $e) {
            // Mensagem curta e técnica; exceções de banco não trazem valores (ver bootstrap/app.php).
            return ['ok' => false, 'critico' => $critico, 'detalhe' => Str::limit($e->getMessage(), 120)];
        }
    }
}
