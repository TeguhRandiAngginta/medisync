<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    public function deleteAny(User $user): bool
    {
        return in_array($user->role->slug ?? '', ['superadmin', 'owner']);
    }

    public function delete(User $user, Sale $sale): bool
    {
        return in_array($user->role->slug ?? '', ['superadmin', 'owner']);
    }
}