<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_log';
    protected $primaryKey = 'id_audit';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = 'date_action';
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'action', 'entite_type', 'id_entite', 
        'anciennes_valeurs', 'nouvelles_valeurs', 'adresse_ip', 'user_agent'
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}