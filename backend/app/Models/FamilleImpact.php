<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilleImpact extends Model
{
    protected $table = 'famille_impact';
    protected $primaryKey = 'id_famille';
    public $incrementing = false;
    protected $keyType = 'string';
    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;
    protected $fillable = ['id_famille', 'code', 'nom', 'zone', 'description', 'actif', 'latitude', 'longitude'];
    protected $casts = [
        'actif' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function affectations(): HasMany
    {
        return $this->hasMany(AppartenirFamille::class, 'id_famille');
    }
}
