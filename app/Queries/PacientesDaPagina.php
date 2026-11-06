<?php

namespace App\Queries;

use App\Models\Matricula;
use App\Models\Paciente;
use App\Support\Tela;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/** Consultas e projeções de leitura; não cria nem altera entidades. */
class PacientesDaPagina
{
    private const COLUNAS_LISTA = ['pacientes.id', 'pacientes.nome', 'pacientes.telefone', 'pacientes.email', 'pacientes.status_paciente', 'pacientes.foto'];

    private static function parametros(Request $request): array
    {
        $input = $request->query();
        // O filtro antigo era includes(), com espaços e curingas literais.
        parse_str($request->server('QUERY_STRING', ''), $original);
        if (array_key_exists('q', $original)) {
            $input['q'] = $original['q'];
        }

        return Validator::make($input, [
            'q' => 'nullable|string|max:150', 'page' => 'nullable|integer|min:1',
            'situacao' => ['nullable', Rule::in(['Ativo', 'Inativo'])],
            'matricula' => ['nullable', Rule::in(['com', 'sem'])],
            'dia' => 'nullable|integer|between:0,6',
            'modalidade' => ['nullable', Rule::in(array_values(Tela::MODALIDADES))],
            'cobranca' => ['nullable', Rule::in(['pendente'])],
        ])->validate();
    }

    private static function busca(Builder $query, string $texto): void
    {
        if ($texto !== '') {
            $literal = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $texto);
            $query->where('pacientes.nome', 'ilike', '%'.$literal.'%');
        }
    }

    private static function pagina(Builder $query, array $params, int $tamanho): LengthAwarePaginator
    {
        $pagina = $query->paginate($tamanho, page: (int) ($params['page'] ?? 1));
        if ($pagina->currentPage() > $pagina->lastPage()) {
            $pagina = $query->paginate($tamanho, page: $pagina->lastPage());
        }

        return $pagina;
    }

    private static function meta(LengthAwarePaginator $pagina): array
    {
        return ['page' => $pagina->currentPage(), 'lastPage' => $pagina->lastPage(), 'total' => $pagina->total(),
            'from' => $pagina->firstItem(), 'to' => $pagina->lastItem(), 'perPage' => $pagina->perPage()];
    }

    public static function lista(Request $request): array
    {
        $params = self::parametros($request);
        $query = Paciente::comResumo(false, self::COLUNAS_LISTA);
        self::busca($query, $params['q'] ?? '');
        $ativa = fn ($q) => $q->where(fn ($q) => $q->where('status_matricula', 'ativa')->orWhere('status_matricula', ''));
        if ($params['situacao'] ?? null) {
            $query->where('status_paciente', $params['situacao'] === 'Ativo' ? '=' : '!=', 'ativo');
        }
        if (($params['matricula'] ?? null) === 'com') {
            $query->whereHas('matriculas', $ativa);
        } elseif (($params['matricula'] ?? null) === 'sem') {
            $query->whereDoesntHave('matriculas', $ativa);
        }
        if (isset($params['dia']) && $params['dia'] !== '') {
            $query->whereHas('matriculas', fn ($q) => $ativa($q)->where('dia_da_matricula', Matricula::DIAS[(int) $params['dia']]));
        }
        if ($params['modalidade'] ?? null) {
            $query->whereHas('matriculas', fn ($q) => $ativa($q)->where('tipo_da_consulta', array_search($params['modalidade'], Tela::MODALIDADES, true)));
        }
        if (($params['cobranca'] ?? null) === 'pendente') {
            $query->whereHas('cobrancas', fn ($q) => $q->where('situacao', 'pendente'));
        }
        $pagina = self::pagina($query, $params, 10);

        return ['patients' => $pagina->getCollection()->map->paraLista()->values(), 'pagination' => self::meta($pagina),
            'q' => $params['q'] ?? '', 'filters' => array_replace(['situacao' => '', 'matricula' => '', 'dia' => '', 'modalidade' => '', 'cobranca' => ''],
                array_map(fn ($value) => $value ?? '', array_intersect_key($params, array_flip(['situacao', 'matricula', 'dia', 'modalidade', 'cobranca']))))];
    }

    public static function indiceClinico(Request $request): array
    {
        $params = self::parametros($request);
        $query = Paciente::select(['id', 'nome', 'foto'])->orderBy('nome')->orderBy('id');
        self::busca($query, $params['q'] ?? '');
        $pagina = self::pagina($query, $params, 20);

        return ['patients' => $pagina->getCollection()->map->paraAvatar()->values(), 'pagination' => self::meta($pagina), 'q' => $params['q'] ?? ''];
    }

    public static function perfil(int $id): ?array
    {
        return Paciente::comResumo()->find($id)?->paraTela();
    }

    public static function reservas()
    {
        return Matricula::where(fn ($q) => $q->where('status_matricula', 'ativa')->orWhere('status_matricula', ''))
            ->select('matriculas.*')->join('pacientes', 'pacientes.id', '=', 'matriculas.paciente_id')
            ->with('paciente:id,nome,status_paciente')->orderBy('pacientes.nome')->orderBy('matriculas.id')->get()
            ->map(fn ($m) => ['patientId' => $m->paciente_id, 'name' => $m->paciente->nome, 'patientActive' => $m->paciente->ativo(),
                'weekday' => $m->diaIso() - 1, 'time' => substr($m->horario_da_matricula, 0, 5)]);
    }

    /** Inativos com sessão mais recente primeiro; o Dashboard mostra só os primeiros e o total vem de totais(). */
    public static function atencao(int $limite = 8)
    {
        return Paciente::where('status_paciente', '!=', 'ativo')->comResumo(false, ['pacientes.id', 'pacientes.nome', 'pacientes.foto'])
            ->reorder()->orderByRaw('resumo_consultas.ultima_sessao DESC NULLS LAST')->orderBy('pacientes.nome')->limit($limite)
            ->get()->map(fn ($p) => [...$p->paraAvatar(), 'lastSession' => Tela::data($p->ultima_sessao ? Carbon::parse($p->ultima_sessao) : null) ?? '—']);
    }

    public static function totais(): array
    {
        $contagem = Paciente::selectRaw("count(*) AS total, count(*) FILTER (WHERE status_paciente = 'ativo') AS ativos")->first();

        return ['total' => (int) $contagem->total, 'active' => (int) $contagem->ativos, 'inactive' => (int) $contagem->total - (int) $contagem->ativos];
    }

    public static function relatorio()
    {
        return Paciente::comResumo(false, ['pacientes.id', 'pacientes.nome', 'pacientes.telefone', 'pacientes.email',
            'pacientes.foto', 'pacientes.status_paciente', 'pacientes.data_nascimento', 'pacientes.sexo', 'pacientes.criado_em'])
            ->get()->map(fn ($p) => [...array_intersect_key($p->paraLista(), array_flip(['id', 'name', 'phone', 'status', 'sessions', 'lastSession', 'nextSession'])),
                'nascimento' => Tela::data($p->data_nascimento), 'genero' => $p->sexo ? Tela::SEXOS[$p->sexo] : null,
                'cadastro' => Tela::data($p->criado_em)]);
    }

    public static function opcoes(Request $request): array
    {
        $params = self::parametros($request);
        $request->validate(['selected' => 'nullable|integer|min:1', 'details' => 'nullable|boolean']);
        $query = Paciente::select(['id', 'nome'])->orderBy('nome')->orderBy('id');
        self::busca($query, $params['q'] ?? '');
        $pagina = self::pagina($query, $params, 20);
        $id = $request->integer('selected') ?: $pagina->getCollection()->first()?->id;
        $selecionado = $id ? Paciente::select($request->boolean('details') ? ['id', 'nome', 'criado_em'] : ['id', 'nome'])
            ->when($request->boolean('details'), fn ($q) => $q->with(['matriculas' => fn ($q) => $q->orderBy('id')]))->find($id) : null;
        $selected = $selecionado ? ['id' => $selecionado->id, 'name' => $selecionado->nome] : null;
        if ($selecionado && $request->boolean('details')) {
            $selected += ['cadastro' => Tela::data($selecionado->criado_em), 'matriculas' => $selecionado->matriculas->map->paraTela()->values()];
        }

        return ['items' => $pagina->getCollection()->map(fn ($p) => ['id' => $p->id, 'name' => $p->nome]), 'pagination' => self::meta($pagina), 'selected' => $selected];
    }
}
