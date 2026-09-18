<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffecterRoleMetier extends Model
{
    protected $table = 'affecter_role_metier';
    public $incrementing = false;
    // Clé primaire composite gérée implicitement par Laravel via la relation, 
    // mais on peut la définir pour les requêtes directes.
    protected $primaryKey = ['user_id', 'id_role', 'date_debut']; 

    const CREATED_AT = null;
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'id_role', 'date_debut', 'date_fin', 'actif'
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleMetier::class, 'id_role');
    }
}