<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Famille extends Model
{
    protected $table = 'famille';
    protected $primaryKey = 'id_famille';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null;

    protected $fillable = [
        'id_famille', 'nom_famille', 'adresse', 'telephone_principal',
        'responsable_legal_id',
    ];

    public function responsableLegal(): BelongsTo
    {
        return $this->belongsTo(Personne::class, 'responsable_legal_id');
    }

    public function relations(): HasMany
    {
        return $this->hasMany(RelationFamiliale::class, 'id_famille');
    }
}
