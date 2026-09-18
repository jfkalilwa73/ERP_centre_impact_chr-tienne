<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Personne extends Model
{
    protected $table = 'personne';
    protected $primaryKey = 'id_personne';
    public $incrementing = false;
    protected $keyType = 'string'; // UUID

    // Mapping des timestamps personnalisés
    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'id_personne','user_id', 'nom', 'prenom', 'date_naissance', 'sexe', 
        'telephone', 'adresse', 'photo_url', 'statut'
    ];

    protected $casts = [
        'date_naissance' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function affectationsDepartement(): HasMany
    {
        return $this->hasMany(AffecterDepartement::class, 'id_personne');
    }
}