<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatutMembre extends Model
{
    protected $table = 'historique_statut_membre';
    protected $primaryKey = 'id_historique';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id_historique', 'id_membre', 'ancien_statut', 'nouveau_statut',
        'motif', 'change_par', 'date_changement',
    ];

    protected $casts = [
        'date_changement' => 'datetime',
    ];

    public function membre(): BelongsTo
    {
        return $this->belongsTo(Membre::class, 'id_membre');
    }

    public function changePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'change_par');
    }
}
