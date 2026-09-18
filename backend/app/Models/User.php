<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'mfa_active', 'statut', 
        'derniere_connexion', 'date_desactivation'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'mfa_active' => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_desactivation' => 'datetime',
    ];

    // Relations
    public function personne(): HasOne
    {
        return $this->hasOne(Personne::class, 'user_id');
    }

    public function tokensMetier(): HasMany
    {
        return $this->hasMany(TokenMetier::class, 'user_id');
    }

    public function rolesMetier(): BelongsToMany
    {
        return $this->belongsToMany(RoleMetier::class, 'affecter_role_metier', 'user_id', 'id_role')
                    ->withPivot('date_debut', 'date_fin', 'actif')
                    ->wherePivot('actif', true);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }
}