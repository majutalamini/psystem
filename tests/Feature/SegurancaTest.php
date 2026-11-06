<?php

namespace Tests\Feature;

use App\Actions\RevogarConta;
use App\Models\Documento;
use App\Models\Psicologo;
use App\Notifications\RedefinirSenha;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use PDOException;
use PHPUnit\Framework\AssertionFailedError;
use ZipArchive;

/** Etapa 3: acesso direto às rotas, arquivos privados, uploads, revogação, cabeçalhos e logs. */
class SegurancaTest extends ConsultorioTestCase
{
    private const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        Storage::fake('public');
    }

    /**
     * Arquivo temporário real: o tipo é detectado pelo conteúdo, como num upload de verdade.
     * (Os arquivos falsos do Laravel informam o tipo pela extensão do nome e não servem para este teste.)
     */
    private function arquivo(string $nome, string $conteudo): UploadedFile
    {
        $caminho = tempnam(sys_get_temp_dir(), 'upload');
        file_put_contents($caminho, $conteudo);

        return new UploadedFile($caminho, $nome, null, null, true);
    }

    private function pdf(string $nome = 'laudo.pdf'): UploadedFile
    {
        return $this->arquivo($nome, "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n");
    }

    private function docx(): UploadedFile
    {
        $caminho = tempnam(sys_get_temp_dir(), 'docx');
        $zip = new ZipArchive;
        $zip->open($caminho, ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        $zip->addFromString('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>');
        $zip->addFromString('word/_rels/document.xml.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
        $zip->close();

        return new UploadedFile($caminho, 'relatorio.docx', null, null, true);
    }

    private function anexar($paciente, UploadedFile $arquivo)
    {
        return $this->from("/pacientes/{$paciente->id}")->post("/pacientes/{$paciente->id}/documentos", ['title' => 'Doc', 'file' => $arquivo]);
    }

    public function test_visitante_nao_acessa_dados_clinicos_por_rota_direta(): void
    {
        $paciente = $this->paciente();
        $prontuario = $paciente->prontuarios()->create(['psicologo_id' => $this->psicologa->id, 'data_atendimento' => '2026-09-01', 'observacoes_consulta' => 'Sigiloso']);
        $anamnese = $paciente->anamneses()->create(['psicologo_id' => $this->psicologa->id, 'titulo' => 'A']);
        $documento = $paciente->documentos()->create(['titulo' => 'Doc', 'nome_arquivo' => 'a.pdf', 'caminho' => 'documentos/a.pdf', 'tamanho' => 1]);
        Storage::put('documentos/a.pdf', 'conteudo');
        Auth::logout();

        foreach ([
            ['get', "/pacientes/{$paciente->id}"], ['get', '/prontuarios?paciente='.$paciente->id], ['get', '/anamneses'],
            ['get', "/documentos/{$documento->id}"], ['get', "/pacientes/{$paciente->id}/foto"], ['get', '/financeiro'],
            ['put', "/prontuarios/{$prontuario->id}"], ['delete', "/prontuarios/{$prontuario->id}"],
            ['put', "/anamneses/{$anamnese->id}"], ['delete', "/anamneses/{$anamnese->id}"], ['delete', "/documentos/{$documento->id}"],
            ['post', "/pacientes/{$paciente->id}/inativar"], ['delete', "/pacientes/{$paciente->id}"],
        ] as [$metodo, $url]) {
            $this->{$metodo}($url)->assertRedirect('/login');
        }

        $this->assertSame('Sigiloso', $prontuario->fresh()->observacoes_consulta);
        $this->assertTrue(Documento::whereKey($documento->id)->exists());
    }

    public function test_documento_valido_e_aceito_e_baixado_como_anexo_protegido(): void
    {
        $paciente = $this->paciente();
        $this->anexar($paciente, $this->pdf())->assertSessionHasNoErrors();
        $this->anexar($paciente, $this->docx())->assertSessionHasNoErrors();
        $this->assertSame(2, $paciente->documentos()->count());

        $resposta = $this->get('/documentos/'.$paciente->documentos()->first()->id.'?baixar=1')->assertOk();
        $this->assertStringStartsWith('attachment', $resposta->headers->get('Content-Disposition'));
        $this->assertSame('nosniff', $resposta->headers->get('X-Content-Type-Options'));
        $this->assertStringContainsString('no-store', $resposta->headers->get('Cache-Control'));
    }

    public function test_upload_recusa_html_svg_executavel_disfarcado_e_tamanho_acima_do_limite(): void
    {
        $paciente = $this->paciente();
        $aceitos = [];
        foreach ([
            $this->arquivo('pagina.html', '<html><script>alert(1)</script></html>'),
            $this->arquivo('falso.pdf', '<html><body>não é pdf</body></html>'),
            $this->arquivo('imagem.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
            $this->arquivo('programa.pdf', "MZ\x90\x00".str_repeat("\x00", 64)),
            $this->arquivo('grande.pdf', "%PDF-1.4\n".str_repeat('0', 21 * 1024 * 1024)),
        ] as $arquivo) {
            try {
                $this->anexar($paciente, $arquivo)->assertSessionHasErrors('file');
            } catch (AssertionFailedError) {
                $aceitos[] = $arquivo->getClientOriginalName();
            }
        }
        $this->assertSame([], $aceitos);
        $this->assertSame(0, $paciente->documentos()->count());
    }

    public function test_foto_fica_no_disco_privado_e_so_sai_para_quem_esta_logado(): void
    {
        $paciente = $this->paciente();
        $png = $this->arquivo('foto.png', base64_decode(self::PNG_1X1));
        $this->from("/pacientes/{$paciente->id}")->post("/pacientes/{$paciente->id}/foto", ['foto' => $png])->assertSessionHasNoErrors();

        $paciente->refresh();
        Storage::disk('local')->assertExists($paciente->foto);
        $this->assertSame([], Storage::disk('public')->allFiles());
        $this->assertStringStartsWith(url("/pacientes/{$paciente->id}/foto").'?v=', $paciente->paraAvatar()['photo']);

        $foto = $this->get("/pacientes/{$paciente->id}/foto")->assertOk();
        $this->assertSame('image/png', $foto->headers->get('Content-Type'));
        $this->assertSame('nosniff', $foto->headers->get('X-Content-Type-Options'));

        $svg = $this->arquivo('foto.png', '<svg xmlns="http://www.w3.org/2000/svg"/>'); // SVG disfarçado de PNG
        $this->from("/pacientes/{$paciente->id}")->post("/pacientes/{$paciente->id}/foto", ['foto' => $svg])->assertSessionHasErrors('foto');

        Auth::logout();
        $this->get("/pacientes/{$paciente->id}/foto")->assertRedirect('/login');
    }

    public function test_comando_move_fotos_antigas_do_disco_publico(): void
    {
        $paciente = $this->paciente();
        Storage::disk('public')->put('fotos/antiga.png', 'png');
        $paciente->forceFill(['foto' => 'fotos/antiga.png'])->save();

        $this->artisan('fotos:tornar-privadas')->expectsOutputToContain('1 foto(s) movida(s)')->assertSuccessful();

        Storage::disk('local')->assertExists('fotos/antiga.png');
        Storage::disk('public')->assertMissing('fotos/antiga.png');
    }

    public function test_conta_revogada_perde_a_sessao_aberta_o_login_e_a_recuperacao_de_senha(): void
    {
        Notification::fake();
        // Sessão real (login pelo formulário), como no navegador.
        Auth::logout();
        $this->post('/login', ['email' => $this->psicologa->email, 'password' => 'segredo123', 'remember' => true])->assertRedirect('/');
        $this->get('/agenda')->assertOk();
        $tokenAntes = $this->psicologa->fresh()->remember_token;

        $this->artisan('psicologo:revogar', ['email' => $this->psicologa->email])->assertSuccessful();

        // A sessão aberta antes da revogação perde o acesso na próxima requisição (que relê a conta).
        Auth::forgetGuards();
        $this->get('/agenda')->assertRedirect('/login');
        $this->assertGuest();
        $this->assertNotSame($tokenAntes, $this->psicologa->fresh()->remember_token);

        $this->post('/login', ['email' => $this->psicologa->email, 'password' => 'segredo123'])
            ->assertSessionHasErrors(['email' => 'E-mail ou senha incorretos.']);
        $this->assertGuest();

        $this->post('/esqueci-senha', ['email' => $this->psicologa->email])->assertSessionHasNoErrors();
        Notification::assertNotSentTo($this->psicologa, RedefinirSenha::class);

        RevogarConta::reativar($this->psicologa->fresh());
        $this->post('/login', ['email' => $this->psicologa->email, 'password' => 'segredo123'])->assertRedirect('/');
        $this->assertAuthenticatedAs(Psicologo::find($this->psicologa->id));
    }

    public function test_respostas_trazem_cabecalhos_de_protecao(): void
    {
        $resposta = $this->get('/agenda')->assertOk();
        $this->assertSame('nosniff', $resposta->headers->get('X-Content-Type-Options'));
        $this->assertSame('SAMEORIGIN', $resposta->headers->get('X-Frame-Options'));
        $this->assertSame('same-origin', $resposta->headers->get('Referrer-Policy'));
    }

    public function test_log_de_erro_de_banco_nao_guarda_os_valores_da_consulta(): void
    {
        Log::spy();
        report(new QueryException('pgsql', 'insert into prontuarios (observacoes_consulta) values (?)', ['Conteúdo clínico sigiloso'], new PDOException('falha')));

        Log::shouldHaveReceived('error')->once()->withArgs(function (string $mensagem, array $contexto) {
            return $mensagem === 'Falha de banco de dados'
                && ! str_contains(json_encode($contexto, JSON_UNESCAPED_UNICODE), 'sigiloso')
                && $contexto['sql'] === 'insert into prontuarios (observacoes_consulta) values (?)';
        });
    }
}
