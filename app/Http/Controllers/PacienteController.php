<?php

namespace App\Http\Controllers;

use App\Models\Anamnese;
use App\Models\AnamneseModelo;
use App\Models\Paciente;
use App\Models\Prontuario;
use App\Rules\Cpf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PacienteController extends Controller
{
    public function index()
    {
        // A lista de pacientes já vem nas props compartilhadas (HandleInertiaRequests).
        return Inertia::render('Pacientes/Pacientes');
    }

    public function show(Paciente $paciente)
    {
        $paciente->load(['documentos' => fn ($q) => $q->latest('criado_em')]);
        return Inertia::render('Pacientes/PatientProfile', [
            'patientId' => $paciente->id,
            'records' => Prontuario::listaDoPaciente($paciente->id),
            'anamnese' => [
                'secoes' => AnamneseModelo::with('perguntas')->first()?->secoes() ?? [],
                'lista' => Anamnese::listaDoPaciente($paciente->id),
            ],
            'documents' => $paciente->documentos->map->paraTela(),
            'receivables' => $paciente->cobrancas()
                ->where('situacao', '!=', 'cancelado')
                ->with(['pagamentos', 'paciente'])
                ->orderByDesc('vencimento')
                ->get()
                ->map->paraTela(),
        ]);
    }

    public function store(Request $request)
    {
        $paciente = Paciente::create([
            ...Paciente::dadosDoFormulario($this->validar($request)),
            'status_paciente' => 'inativo',
        ]);

        return redirect()->route('pacientes.show', $paciente);
    }

    public function update(Request $request, Paciente $paciente)
    {
        $paciente->update(Paciente::dadosDoFormulario($this->validar($request, $paciente)));

        return back();
    }

    public function foto(Request $request, Paciente $paciente)
    {
        $request->validate(['foto' => 'required|image|max:4096']);

        if ($paciente->foto) {
            Storage::disk('public')->delete($paciente->foto);
        }
        $paciente->update(['foto' => $request->file('foto')->store('fotos', 'public')]);

        return back();
    }

    private function validar(Request $request, ?Paciente $paciente = null): array
    {
        $request->merge(['cpf' => preg_replace('/\D/', '', (string) $request->input('cpf'))]);

        return $request->validate([
            'name' => 'required|string|max:150',
            'cpf' => ['required', new Cpf, Rule::unique('pacientes', 'cpf')->ignore($paciente)],
            'nascimento' => 'required|date_format:d/m/Y|before_or_equal:'.today()->format('d/m/Y'),
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:150',
            'endereco' => 'nullable|string|max:255',
            'cidade' => 'nullable|string|max:80',
            'uf' => 'nullable|string|size:2',
            'emergenciaNome' => 'nullable|string|max:150',
            'emergenciaTelefone' => 'nullable|string|max:20',
            'observacoes' => 'nullable|string',
            'aceitaWhatsapp' => 'boolean',
        ], [
            'nascimento.before_or_equal' => 'A data de nascimento não pode ser futura.',
        ], [
            'name' => 'nome', 'nascimento' => 'data de nascimento', 'phone' => 'telefone',
        ]);
    }
}
