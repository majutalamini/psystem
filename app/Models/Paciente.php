<?php

namespace App\Models;

use App\Http\Controllers\FotoController;
use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Paciente extends Model
{
    protected $table = 'pacientes';

    protected $attributes = ['dia_vencimento' => 10];

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    public const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    protected $fillable = [
        'nome', 'cpf', 'telefone', 'email', 'data_nascimento', 'sexo', 'endereco',
        'endereco_cidade', 'endereco_uf', 'contato_emergencia_nome',
        'contato_emergencia_telefone', 'observacoes', 'status_paciente', 'foto', 'dia_vencimento',
    ];

    protected function casts(): array
    {
        return ['data_nascimento' => 'date'];
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function prontuarios(): HasMany
    {
        return $this->hasMany(Prontuario::class);
    }

    public function anamneses(): HasMany
    {
        return $this->hasMany(Anamnese::class);
    }

    public function respostasAnamnese(): HasMany
    {
        return $this->hasMany(AnamneseResposta::class);
    }

    public function cobrancas(): HasMany
    {
        return $this->hasMany(Cobranca::class);
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class);
    }

    public function ativo(): bool
    {
        return $this->status_paciente === 'ativo';
    }

    /** Ativo se tiver ao menos uma matrícula ativa; inativo se não tiver. */
    public function sincronizarStatus(): void
    {
        $this->update(['status_paciente' => $this->matriculas()->ativas()->exists() ? 'ativo' : 'inativo']);
    }

    /** Sessões realizadas, última e próxima sessão, matrícula e cobranças em aberto. */
    public function scopeComResumo(Builder $query, bool $relacoes = true, array $colunas = ['pacientes.*']): void
    {
        $resumo = DB::table('agenda')->select('paciente_id')
            ->selectRaw("count(*) FILTER (WHERE status = 'realizado') AS sessoes")
            ->selectRaw("max(data_hora_consulta) FILTER (WHERE status = 'realizado') AS ultima_sessao")
            ->selectRaw("min(data_hora_consulta) FILTER (WHERE status IN ('agendado', 'confirmado') AND data_hora_consulta >= ?) AS proxima_sessao", [now()->startOfDay()])
            ->groupBy('paciente_id');
        $query
            ->leftJoinSub($resumo, 'resumo_consultas', 'resumo_consultas.paciente_id', '=', 'pacientes.id')
            ->select([...$colunas, 'resumo_consultas.sessoes', 'resumo_consultas.ultima_sessao', 'resumo_consultas.proxima_sessao'])
            ->when($relacoes, fn ($q) => $q->with(['matriculas' => fn ($q) => $q->orderBy('id'), 'cobrancas' => fn ($q) => $q->where('situacao', 'pendente')->orderBy('vencimento')->with('pagamentos')]))
            ->orderBy('pacientes.nome');
    }

    /** Converte os campos do formulário do front para as colunas do banco. */
    public static function dadosDoFormulario(array $f): array
    {
        return [
            'nome' => $f['name'],
            'cpf' => $f['cpf'],
            'telefone' => $f['phone'],
            'email' => $f['email'] ?? null,
            'data_nascimento' => Tela::lerData($f['nascimento']),
            'endereco' => $f['endereco'] ?? null,
            'endereco_cidade' => $f['cidade'] ?? null,
            'endereco_uf' => isset($f['uf']) ? mb_strtoupper($f['uf']) : null,
            'contato_emergencia_nome' => $f['emergenciaNome'] ?? null,
            'contato_emergencia_telefone' => $f['emergenciaTelefone'] ?? null,
            'observacoes' => $f['observacoes'] ?? null,
        ];
    }

    /** Formato que as telas do front esperam (ver resources/js/data/patients.js original). */
    /** Mensalidades que ainda vão vencer e não receberam nada: a tela pergunta se cancela ao encerrar a matrícula. */
    private function mensalidadesAVencer(Matricula $matricula): array
    {
        if (! $this->relationLoaded('cobrancas')) {
            return [];
        }

        return $this->cobrancas
            ->filter(fn ($c) => $c->matricula_id === $matricula->id && $c->competencia && $c->pagamentos->isEmpty() && $c->vencimento->gte(today()))
            ->map(fn ($c) => ['competencia' => $c->competencia->format('m/Y'), 'valor' => (float) $c->valor])
            ->values()
            ->all();
    }

    public function paraAvatar(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nome,
            'initials' => Tela::iniciais($this->nome),
            'color' => Tela::cor($this->id),
            'photo' => FotoController::url('pacientes', $this->id, $this->foto),
        ];
    }

    public function paraLista(): array
    {
        $ultima = $this->ultima_sessao ? Carbon::parse($this->ultima_sessao) : null;
        $proxima = $this->proxima_sessao ? Carbon::parse($this->proxima_sessao) : null;

        return [
            ...$this->paraAvatar(),
            'phone' => Tela::telefone($this->telefone),
            'email' => $this->email,
            'status' => $this->ativo() ? 'Ativo' : 'Inativo',
            'sessions' => (int) ($this->sessoes ?? 0),
            'lastSession' => Tela::data($ultima) ?? '—',
            'nextSession' => Tela::data($proxima) ?? '—',
        ];
    }

    /** Perfil completo: não deve ser compartilhado com páginas que só usam nomes. */
    public function paraTela(): array
    {
        $pendente = $this->relationLoaded('cobrancas') ? $this->cobrancas->first() : null;

        return [
            ...$this->paraLista(),
            'cpf' => Tela::cpf($this->cpf),
            'nascimento' => Tela::data($this->data_nascimento),
            'sexo' => $this->sexo,
            'genero' => $this->sexo ? Tela::SEXOS[$this->sexo] : null,
            'cadastro' => Tela::data($this->criado_em),
            'endereco' => $this->endereco,
            'cidade' => $this->endereco_cidade,
            'uf' => $this->endereco_uf,
            'diaVencimento' => (int) ($this->dia_vencimento ?: 10),
            'emergenciaNome' => $this->contato_emergencia_nome,
            'emergenciaTelefone' => Tela::telefone($this->contato_emergencia_telefone),
            'observacoes' => $this->observacoes,
            'matriculas' => $this->matriculas->map(fn ($m) => [...$m->paraTela(), 'mensalidadesAVencer' => $this->mensalidadesAVencer($m)])->values(),
            'cobrancaPendente' => $pendente?->paraTela(),
        ];
    }
}
