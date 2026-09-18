<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffecterRoleMetier extends Model
{
    protected $table = 'affecter_role_metier';
    public $incrementing = false;
    public $timestamps = false; // Pas de created_at/updated_at standards

    protected $fillable = ['user_id', 'id_role', 'date_debut', 'date_fin', 'actif'];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function role(): BelongsTo { return $this->belongsTo(RoleMetier::class, 'id_role'); }
}