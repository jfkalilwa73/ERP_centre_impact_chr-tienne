<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttribuerPermission extends Model
{
    protected $table = 'attribuer_permission';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['id_role', 'id_permission'];

    public function role(): BelongsTo { return $this->belongsTo(RoleMetier::class, 'id_role'); }
    public function permission(): BelongsTo { return $this->belongsTo(PermissionMetier::class, 'id_permission'); }
}