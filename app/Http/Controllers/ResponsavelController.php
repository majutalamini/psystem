<?php

namespace App\Http\Controllers;

use App\Models\Responsavel;
use App\Rules\Cpf;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ResponsavelController extends Controller
{
    public function index()
    {
        return Inertia::render('Responsaveis/Responsaveis', [
            'guardians' => Responsavel::withCount('pacientes')->orderBy('nome')->get()->map->resumo(),
        ]);
    }

    public function show(Responsavel $responsavel)
    {
        return Inertia::render('Responsaveis/ResponsavelProfile', [
            'guardian' => $responsavel->load('pacientes')->paraTela(),
        ]);
    }

    /** Cria e volta para a tela de origem (o cadastro do paciente usa isso para criar o responsável na hora). */
    public function store(Request $request)
    {
        $responsavel = Responsavel::create(Responsavel::dadosDoFormulario($this->validar($request)));

        return back()->with('sucesso', 'Responsável cadastrado.')->with('novoResponsavel', $responsavel->id);
    }

    public function update(Request $request, Responsavel $responsavel)
    {
        $responsavel->update(Responsavel::dadosDoFormulario($this->validar($request, $responsavel)));

        return back();
    }

    /** Não exclui quem ainda responde por paciente menor de idade (o menor ficaria sem responsável). */
    public function destroy(Responsavel $responsavel)
    {
        $menores = $responsavel->pacientes()->get()->filter->menorDeIdade();
        if ($menores->isNotEmpty()) {
            throw ValidationException::withMessages([
                'responsavel' => 'Este responsável tem paciente menor de idade ('.$menores->pluck('nome')->join(', ').'). Troque o responsável no cadastro do paciente antes de excluir.',
            ]);
        }

        $responsavel->delete();

        return redirect()->route('responsaveis')->with('sucesso', 'Responsável excluído.');
    }

    private function validar(Request $request, ?Responsavel $responsavel = null): array
    {
        $request->merge(['cpf' => preg_replace('/\D/', '', (string) $request->input('cpf'))]);

        return $request->validate([
            'name' => 'required|string|max:150',
            'cpf' => ['nullable', new Cpf, Rule::unique('responsaveis', 'cpf')->ignore($responsavel)],
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:150',
            'endereco' => 'nullable|string|max:255',
            'observacoes' => 'nullable|string',
        ], [
            'cpf.unique' => 'Já existe um responsável cadastrado com este CPF.',
        ], [
            'name' => 'nome', 'phone' => 'telefone',
        ]);
    }
}
