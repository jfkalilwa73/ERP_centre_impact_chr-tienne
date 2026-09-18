<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TokenMetier extends Model
{
    protected $table = 'token_metier';
    protected $primaryKey = 'id_token';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_creation';
    const UPDATED_AT = null; // Pas de mise à jour automatique, gestion manuelle via date_revocation

    protected $fillable = [
        'user_id', 'type_token', 'hash_token', 'nom', 'scope', 'metadata',
        'date_expiration', 'derniere_utilisation', 'adresse_ip_derniere_utilisation',
        'user_agent_derniere_utilisation', 'nombre_utilisations', 'nombre_utilisations_max',
        'actif', 'date_revocation', 'motif_revocation'
    ];

    protected $casts = [
        'scope' => 'array',
        'metadata' => 'array',
        'date_expiration' => 'datetime',
        'derniere_utilisation' => 'datetime',
        'date_revocation' => 'datetime',
        'actif' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}