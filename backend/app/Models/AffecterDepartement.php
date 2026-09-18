<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffecterDepartement extends Model
{
    protected $table = 'affecter_departement';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['id_personne', 'id_departement', 'fonction', 'date_debut', 'date_fin', 'actif'];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'actif' => 'boolean',
    ];

    public function personne(): BelongsTo { return $this->belongsTo(Personne::class, 'id_personne'); }
    public function departement(): BelongsTo { return $this->belongsTo(Departement::class, 'id_departement'); }
}