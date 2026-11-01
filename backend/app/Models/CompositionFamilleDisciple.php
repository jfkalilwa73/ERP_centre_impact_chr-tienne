<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompositionFamilleDisciple extends Model
{
    protected $table = 'composition_famille_disciple';
    protected $primaryKey = 'id_composition';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id_composition', 'id_famille_disciple', 'id_membre',
        'departement_origine_id', 'date_debut', 'date_fin', 'actif',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function familleDisciple(): BelongsTo
    {
        return $this->belongsTo(FamilleDisciple::class, 'id_famille_disciple');
    }

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class, 'id_membre');
    }

    public function departementOrigine(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Departement::class, 'departement_origine_id');
    }
}
