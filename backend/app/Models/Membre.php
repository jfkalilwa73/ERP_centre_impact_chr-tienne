<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Membre extends Model
{
    protected $table = 'membre';
    protected $primaryKey = 'id_membre';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = 'date_modification';

    protected $fillable = [
        'id_membre', 'id_personne', 'numero_membre', 'date_integration',
        'statut_membre', 'date_changement_statut', 'motif_changement_statut',
        'famille_impact_id',
    ];

    protected $casts = [
        'date_integration' => 'date',
        'date_changement_statut' => 'datetime',
        'statut_membre' => 'string',
        'actif' => 'boolean',
    ];

    public function personne(): BelongsTo
    {
        return $this->belongsTo(Personne::class, 'id_personne');
    }

    public function familleImpact(): BelongsTo
    {
        return $this->belongsTo(FamilleImpact::class, 'famille_impact_id', 'id_famille');
    }

    public function historiqueStatuts(): HasMany
    {
        return $this->hasMany(HistoriqueStatutMembre::class, 'id_membre');
    }

    public function affectationsFamilleImpact(): HasMany
    {
        return $this->hasMany(AffecterFamilleImpact::class, 'id_membre');
    }
}
