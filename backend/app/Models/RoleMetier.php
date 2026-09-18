<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RoleMetier extends Model
{
    protected $table = 'role_metier';
    protected $primaryKey = 'id_role';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'code', 'nom', 'description', 'niveau_confidentialite', 'actif'
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