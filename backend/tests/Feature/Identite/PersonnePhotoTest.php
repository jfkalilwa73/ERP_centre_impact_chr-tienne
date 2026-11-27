<?php

namespace Tests\Feature\Identite;

use App\Models\Personne;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PersonnePhotoTest extends TestCase
{
    use RefreshDatabase;

    public function test_photo_de_profil_est_stockee_et_servie_depuis_le_stockage(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);
        $this->seConnecter();
        $personneId = $this->creerPersonne();

        $response = $this->post("/api/v1/personnes/{$personneId}/photo", [
            'photo' => UploadedFile::fake()->image('portrait.png'),
        ]);

        $response->assertOk()
            ->assertJsonPath('idPersonne', $personneId);

        $personne = Personne::query()->findOrFail($personneId);
        $this->assertStringStartsWith("personnes/{$personneId}/", $personne->photo_url);
        Storage::disk('local')->assertExists($personne->photo_url);

        $photoResponse = $this->get($response->json('photoUrl'));
        $photoResponse->assertOk();
        $this->assertStringStartsWith('image/png', $photoResponse->headers->get('Content-Type'));
        $this->assertNotEmpty($photoResponse->streamedContent());
    }

    public function test_photo_de_profil_refuse_un_fichier_qui_n_est_pas_une_image(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);
        $this->seConnecter();
        $personneId = $this->creerPersonne();

        $this->post("/api/v1/personnes/{$personneId}/photo", [
            'photo' => UploadedFile::fake()->createWithContent('script.txt', '<?php echo "no";'),
        ])->assertUnprocessable();
    }

    public function test_photo_de_profil_exige_une_session(): void
    {
        $this->post('/api/v1/personnes/'.fake()->uuid().'/photo', [
            'photo' => UploadedFile::fake()->image('portrait.png'),
        ])->assertUnauthorized();
    }

    private function seConnecter(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();
    }

    private function creerPersonne(): string
    {
        return $this->postJson('/api/v1/personnes', [
            'nom' => 'Nuru',
            'prenom' => 'Jean',
        ])->assertCreated()->json('idPersonne');
    }
}
