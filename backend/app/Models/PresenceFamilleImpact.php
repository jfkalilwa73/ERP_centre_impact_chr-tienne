<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresenceFamilleImpact extends Model
{
    protected $table = 'presence_famille_impact';
    protected $primaryKey = 'id_presence';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_presence', 'id_affectation', 'date_reunion',
        'present', 'commentaire', 'enregistre_par',
    ];

    protected $casts = [
        'date_reunion' => 'date',
        'present' => 'boolean',
    ];

    public function affectation(): BelongsTo
    {
        return $this->belongsTo(AffecterFamilleImpact::class, 'id_affectation');
    }

    public function enregistrePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enregistre_par');
    }
}
