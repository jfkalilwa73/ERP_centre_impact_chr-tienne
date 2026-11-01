<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FamilleDisciple extends Model
{
    protected $table = 'famille_disciple';
    protected $primaryKey = 'id_famille_disciple';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_famille_disciple', 'nom', 'periode_debut', 'periode_fin',
        'responsable_id', 'statut',
    ];

    protected $casts = [
        'periode_debut' => 'date',
        'periode_fin' => 'date',
        'statut' => 'string',
        'date_creation' => 'datetime',
    ];

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Personne::class, 'responsable_id');
    }

    public function compositions(): HasMany
    {
        return $this->hasMany(CompositionFamilleDisciple::class, 'id_famille_disciple');
    }
}
