<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoleMetier extends Model
{
    // ⚠️ CES 4 LIGNES SONT CRUCIALES POUR LES UUID
    protected $table = 'role_metier';
    protected $primaryKey = 'id_role';      // Nom de la clé primaire
    public $incrementing = false;           // Ce n'est pas un entier auto-incrémenté
    protected $keyType = 'string';          // C'est une chaîne (UUID)

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_role', 'code', 'nom', 'description', 'niveau_confidentialite', 'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(PermissionMetier::class, 'attribuer_permission', 'id_role', 'id_permission');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'affecter_role_metier', 'id_role', 'user_id')
                    ->withPivot('date_debut', 'date_fin', 'actif');
    }
}