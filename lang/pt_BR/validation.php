<?php

return [
    'after' => 'O campo :attribute deve ser uma data posterior a :date.',
    'array' => 'O campo :attribute deve ser uma lista.',
    'between' => [
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'string' => 'O campo :attribute deve ter entre :min e :max caracteres.',
    ],
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'current_password' => 'A senha atual está incorreta.',
    'date' => 'O campo :attribute não é uma data válida.',
    'date_format' => 'O campo :attribute não está no formato :format.',
    'email' => 'Informe um e-mail válido em :attribute.',
    'exists' => 'O valor escolhido em :attribute não existe.',
    'file' => 'O campo :attribute deve ser um arquivo.',
    'image' => 'O campo :attribute deve ser uma imagem.',
    'in' => 'O valor escolhido em :attribute é inválido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'max' => [
        'array' => 'O campo :attribute não pode ter mais de :max itens.',
        'file' => 'O arquivo :attribute não pode ser maior que :max KB.',
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
    ],
    'min' => [
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
        'file' => 'O arquivo :attribute deve ter pelo menos :min KB.',
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],
    'numeric' => 'O campo :attribute deve ser um número.',
    'required' => 'O campo :attribute é obrigatório.',
    'required_with' => 'O campo :attribute é obrigatório.',
    'size' => [
        'string' => 'O campo :attribute deve ter :size caracteres.',
    ],
    'string' => 'O campo :attribute deve ser um texto.',
    'unique' => 'Este valor de :attribute já está sendo usado por outro cadastro.',
    'uploaded' => 'Não foi possível enviar o arquivo :attribute. Ele pode ser maior do que o servidor aceita.',

    'attributes' => [
        'foto' => 'foto',
        'cpf' => 'CPF',
        'email' => 'e-mail',
        'perfil.crp' => 'CRP',
        'perfil.email' => 'e-mail',
        'perfil.nome' => 'nome',
        'perfil.telefone' => 'telefone',
    ],
];
