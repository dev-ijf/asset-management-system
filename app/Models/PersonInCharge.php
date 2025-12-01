<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PersonInCharge extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'person_in_charges';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'notes',
    ];
}
