<?php

namespace App\Http\Controllers;

use App\Models\Contrato;
use App\Models\Matricula;
use App\Models\Paciente;
use App\Services\Contratos;
use App\Support\Tela;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ContratoController extends Controller
{
    /** Cria o contrato com os dias e horários (obrigatórios), gera a agenda e a cobrança do primeiro pacote. */
    public function store(Request $request, Paciente $paciente, Contratos $contratos)
    {
        $dados = $request->validate([
            'sessoes' => 'required|integer|between:1,100',
            'valor' => 'required|numeric|min:0',
            'inicio' => 'required|date_format:d/m/Y',
            'horarios' => 'required|array|min:1',
            'horarios.*.weekday' => 'required|integer|between:0,6',
            'horarios.*.time' => 'required|date_format:H:i',
            'horarios.*.tipo' => 'required|in:Consulta presencial,Consulta online',
        ], [
            'horarios.required' => 'Informe ao menos um dia e horário para a matrícula.',
            'horarios.min' => 'Informe ao menos um dia e horário para a matrícula.',
        ], [
            'sessoes' => 'quantidade de sessões', 'inicio' => 'data de início',
        ]);

        if ($paciente->contratoAberto()) {
            throw ValidationException::withMessages(['sessoes' => 'Este paciente já tem um contrato em vigor. Encerre-o antes de criar outro.']);
        }

        $vistos = [];
        foreach ($dados['horarios'] as $i => $h) {
            $chave = $h['weekday'].'|'.$h['time'];
            if (isset($vistos[$chave])) {
                throw ValidationException::withMessages(["horarios.{$i}.time" => 'Esse dia e horário já está na lista.']);
            }
            $vistos[$chave] = true;
            Matricula::conferirHorario((int) $h['weekday'], $h['time'], $paciente->id, null, "horarios.{$i}.");
        }

        $contratos->criar($paciente, [
            'sessoes' => (int) $dados['sessoes'],
            'valor' => (float) $dados['valor'],
            'inicio' => Tela::lerData($dados['inicio']),
        ], $dados['horarios']);

        return back();
    }

    public function update(Request $request, Contrato $contrato, Contratos $contratos)
    {
        $dados = $request->validate([
            'sessoes' => 'required|integer|between:1,100',
            'valor' => 'required|numeric|min:0',
        ], [], ['sessoes' => 'quantidade de sessões']);

        if (! $contrato->aberto()) {
            throw ValidationException::withMessages(['sessoes' => 'Este contrato já foi encerrado.']);
        }

        $contratos->alterar($contrato, (int) $dados['sessoes'], (float) $dados['valor']);

        return back();
    }

    /** Encerrar: para de renovar, tira as sessões futuras da agenda e o paciente fica inativo. */
    public function destroy(Contrato $contrato, Contratos $contratos)
    {
        $contratos->encerrar($contrato);

        return back()->with('sucesso', 'Contrato encerrado.');
    }
}
