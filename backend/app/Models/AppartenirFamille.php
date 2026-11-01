<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppartenirFamille extends Model
{
    protected $table = 'appartenir_famille';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = ['id_personne', 'id_famille', 'fonction', 'date_debut', 'date_fin', 'actif'];
    protected $casts = ['date_debut' => 'datetime', 'date_fin' => 'datetime', 'actif' => 'boolean'];

    public function personne(): BelongsTo { return $this->belongsTo(Personne::class, 'id_personne'); }
    public function famille(): BelongsTo { return $this->belongsTo(FamilleImpact::class, 'id_famille'); }
}
