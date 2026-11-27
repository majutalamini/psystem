<?php

namespace App\Models;

use App\Support\Tela;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/** Responsável legal de um ou mais pacientes (obrigatório para paciente menor de idade). */
class Responsavel extends Model
{
    protected $table = 'responsaveis';

    const CREATED_AT = 'criado_em';

    const UPDATED_AT = 'atualizado_em';

    protected $fillable = ['nome', 'cpf', 'telefone', 'email', 'endereco', 'observacoes'];

    public function pacientes(): HasMany
    {
        return $this->hasMany(Paciente::class);
    }

    public static function dadosDoFormulario(array $f): array
    {
        return [
            'nome' => $f['name'],
            'cpf' => $f['cpf'] ?: null,
            'telefone' => $f['phone'],
            'email' => $f['email'] ?? null,
            'endereco' => $f['endereco'] ?? null,
            'observacoes' => $f['observacoes'] ?? null,
        ];
    }

    /** Resumo para listas e para o seletor do cadastro do paciente. */
    public function resumo(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nome,
            'initials' => Tela::iniciais($this->nome),
            'color' => Tela::cor($this->id),
            'phone' => Tela::telefone($this->telefone),
            'email' => $this->email,
            'dependentes' => (int) ($this->pacientes_count ?? 0),
        ];
    }

    public function paraTela(): array
    {
        $pacientes = $this->relationLoaded('pacientes') ? $this->pacientes : $this->pacientes()->get();

        return [
            ...$this->resumo(),
            'cpf' => $this->cpf ? Tela::cpf($this->cpf) : null,
            'endereco' => $this->endereco,
            'observacoes' => $this->observacoes,
            'cadastro' => Tela::data($this->criado_em),
            'dependentes' => $pacientes->count(),
            'pacientes' => $pacientes->sortBy('nome')->map(fn (Paciente $p) => [
                'id' => $p->id,
                'name' => $p->nome,
                'initials' => Tela::iniciais($p->nome),
                'color' => Tela::cor($p->id),
                'photo' => $p->foto ? Storage::url($p->foto) : null,
                'idade' => $p->data_nascimento?->age,
                'parentesco' => $p->responsavel_parentesco,
                'status' => $p->rotuloStatus(),
            ])->values(),
        ];
    }
}
