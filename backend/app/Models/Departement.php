<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departement extends Model
{
    protected $table = 'departement';
    protected $primaryKey = 'id_departement';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_departement', 'code', 'nom', 'mission', 'id_site', 'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class, 'id_site');
    }

    public function affectations(): HasMany
    {
        return $this->hasMany(AffecterDepartement::class, 'id_departement');
    }
}