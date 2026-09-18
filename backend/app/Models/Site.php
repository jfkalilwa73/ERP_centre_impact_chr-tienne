<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    protected $table = 'site';
    protected $primaryKey = 'id_site';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'code', 'nom', 'adresse', 'ville', 'pays', 'telephone', 'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function departements(): HasMany
    {
        return $this->hasMany(Departement::class, 'id_site');
    }
}