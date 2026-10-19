<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RelationFamiliale extends Model
{
    protected $table = 'relation_familiale';
    protected $primaryKey = 'id_relation';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id_relation', 'id_famille', 'id_personne_1', 'id_personne_2',
        'type_relation', 'date_debut', 'date_fin', 'actif',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function famille(): BelongsTo
    {
        return $this->belongsTo(Famille::class, 'id_famille');
    }

    public function personne1(): BelongsTo
    {
        return $this->belongsTo(Personne::class, 'id_personne_1');
    }

    public function personne2(): BelongsTo
    {
        return $this->belongsTo(Personne::class, 'id_personne_2');
    }
}
