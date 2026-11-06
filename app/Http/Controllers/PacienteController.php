<?php

namespace App\Http\Controllers;

use App\Actions\CriarPaciente;
use App\Actions\InativarPaciente;
use App\Models\Anamnese;
use App\Models\AnamneseModelo;
use App\Models\Configuracao;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Models\RegistroAcao;
use App\Queries\PacientesDaPagina;
use App\Rules\Cpf;
use App\Services\Mensalidades;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PacienteController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Pacientes/Pacientes', [
            'patientDirectory' => fn () => PacientesDaPagina::lista($request),
        ]);
    }

    public function opcoes(Request $request)
    {
        return response()->json(PacientesDaPagina::opcoes($request))->header('Cache-Control', 'no-store');
    }

    public function show(Paciente $paciente)
    {
        return Inertia::render('Pacientes/PatientProfile', [
            'patientId' => $paciente->id,
            'patient' => fn () => PacientesDaPagina::perfil($paciente->id),
            'enrollmentReservations' => fn () => PacientesDaPagina::reservas(),
            'simultaneousLimit' => fn () => Configuracao::atual()->consultas_simultaneas,
            'hours' => fn () => Configuracao::atual()->horarios(),
            'records' => fn () => Prontuario::listaDoPaciente($paciente->id),
            'anamnese' => fn () => [
                'secoes' => AnamneseModelo::with('perguntas')->first()?->secoes() ?? [],
                'lista' => Anamnese::listaDoPaciente($paciente->id),
            ],
            'documents' => fn () => $paciente->documentos()->latest('criado_em')->get()->map->paraTela(),
            'receivables' => fn () => $paciente->cobrancas()
                ->where('situacao', '!=', 'cancelado')
                ->with(['pagamentos', 'paciente'])
                ->orderByDesc('vencimento')
                ->get()
                ->map->paraTela(),
        ]);
    }

    public function store(Request $request)
    {
        $paciente = CriarPaciente::executar(Paciente::dadosDoFormulario($this->validar($request)));

        return redirect()->route('pacientes.show', $paciente);
    }

    public function update(Request $request, Paciente $paciente)
    {
        $paciente->update(Paciente::dadosDoFormulario($this->validar($request, $paciente)));

        return back();
    }

    /** Dia do mês em que vence a mensalidade da matrícula; as mensalidades em aberto passam a vencer nele. */
    public function vencimento(Request $request, Paciente $paciente, Mensalidades $mensalidades)
    {
        $dados = $request->validate(['dia' => 'required|integer|between:1,31'], [
            'dia.required' => 'Informe o dia do vencimento.',
            'dia.between' => 'O dia do vencimento deve ficar entre 1 e 31.',
        ]);

        $paciente->update(['dia_vencimento' => $dados['dia']]);
        $mensalidades->atualizarVencimento($paciente);

        return back();
    }

    public function inativar(Paciente $paciente)
    {
        InativarPaciente::executar($paciente);

        return back()->with('sucesso', 'Paciente inativado. As consultas futuras saíram da agenda.');
    }

    /**
     * Só sai o cadastro sem nenhum histórico (ex.: feito por engano). Com atendimento, prontuário, anamnese,
     * documento ou cobrança, a exclusão é recusada: o registro dos atendimentos precisa ser guardado
     * (Resolução CFP 001/2009) e o caminho é inativar. As FKs de histórico também recusam no banco.
     */
    public function destroy(Request $request, Paciente $paciente)
    {
        DB::transaction(function () use ($paciente) {
            Paciente::whereKey($paciente->id)->lockForUpdate()->firstOrFail();

            $historico = array_keys(array_filter([
                'atendimentos realizados' => $paciente->consultas()->where('status', 'realizado')->exists(),
                'prontuários' => $paciente->prontuarios()->exists(),
                'anamneses' => $paciente->anamneses()->exists() || $paciente->respostasAnamnese()->exists(),
                'documentos' => $paciente->documentos()->exists(),
                'cobranças' => $paciente->cobrancas()->exists(),
            ]));
            if ($historico) {
                throw ValidationException::withMessages([
                    'paciente' => 'Este cadastro tem histórico ('.implode(', ', $historico).') e não pode ser excluído. Para tirá-lo da agenda, inative o paciente.',
                ]);
            }

            RegistroAcao::registrar('paciente.excluir', $paciente);
            $paciente->consultas()->delete();
            $paciente->matriculas()->delete();
            $paciente->delete();
        });

        if ($paciente->foto) {
            Storage::delete($paciente->foto);
        }

        $filtros = [];
        $origem = parse_url($request->headers->get('referer', ''));
        if (($origem['path'] ?? '') === '/pacientes') {
            parse_str($origem['query'] ?? '', $parametros);
            $filtros = array_filter(array_intersect_key($parametros, array_flip(['q', 'page', 'situacao', 'matricula', 'dia', 'modalidade', 'cobranca'])), is_scalar(...));
        }

        return redirect()->route('pacientes', $filtros)->with('sucesso', 'Cadastro excluído.');
    }

    public function foto(Request $request, Paciente $paciente)
    {
        $request->validate(['foto' => FotoController::REGRA_UPLOAD], [], ['foto' => 'foto']);

        if ($paciente->foto) {
            Storage::delete($paciente->foto);
        }
        // Disco privado: a foto só sai pela rota autenticada (FotoController).
        $paciente->update(['foto' => $request->file('foto')->store('fotos/pacientes')]);

        return back();
    }

    private function validar(Request $request, ?Paciente $paciente = null): array
    {
        $request->merge([
            'cpf' => preg_replace('/\D/', '', (string) $request->input('cpf')),
            'uf' => mb_strtoupper(trim((string) $request->input('uf'))) ?: null,
        ]);

        return $request->validate([
            'name' => 'required|string|max:150',
            'cpf' => ['required', new Cpf, Rule::unique('pacientes', 'cpf')->ignore($paciente)],
            'nascimento' => 'required|date_format:d/m/Y|before_or_equal:'.today()->format('d/m/Y'),
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:150',
            'endereco' => 'nullable|string|max:255',
            'cidade' => 'nullable|string|max:80',
            'uf' => ['nullable', Rule::in(Paciente::UFS)],
            'emergenciaNome' => 'nullable|string|max:150',
            'emergenciaTelefone' => 'nullable|string|max:20',
            'observacoes' => 'nullable|string',
        ], [
            'nascimento.before_or_equal' => 'A data de nascimento não pode ser futura.',
            'cpf.unique' => 'Já existe um paciente cadastrado com este CPF.',
            'uf.in' => 'Informe uma UF válida (ex: SC).',
        ], [
            'name' => 'nome', 'nascimento' => 'data de nascimento', 'phone' => 'telefone',
        ]);
    }
}
