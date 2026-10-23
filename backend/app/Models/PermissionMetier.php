<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PermissionMetier extends Model
{
    protected $table = 'permission_metier';
    protected $primaryKey = 'id_permission';
    public $incrementing = false;
    protected $keyType = 'string';

    const CREATED_AT = null;
    const UPDATED_AT = null;

    protected $fillable = [
        'id_permission', 'code', 'module', 'action', 'description', 'actif'
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(RoleMetier::class, 'attribuer_permission', 'id_permission', 'id_role');
    }
}