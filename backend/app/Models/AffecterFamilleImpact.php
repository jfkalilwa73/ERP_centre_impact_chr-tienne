<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffecterFamilleImpact extends Model
{
    protected $table = 'affecter_famille_impact';
    protected $primaryKey = 'id_affectation';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_affectation', 'id_membre', 'id_famille_impact',
        'date_debut', 'date_fin', 'actif', 'motif_fin',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class, 'id_membre');
    }

    public function familleImpact(): BelongsTo
    {
        return $this->belongsTo(FamilleImpact::class, 'id_famille_impact', 'id_famille');
    }
}
