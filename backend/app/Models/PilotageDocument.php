<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PilotageDocument extends Model
{
    protected $table = 'pilotage_document';

    protected $primaryKey = 'cle';

    public $incrementing = false;

    protected $keyType = 'string';

    const CREATED_AT = null;

    const UPDATED_AT = 'date_modification';

    protected $fillable = ['cle', 'contenu'];

    protected $casts = [
        'contenu' => 'array',
        'date_modification' => 'datetime',
    ];
}
