<?php

use App\Http\Controllers\CvController;
use Illuminate\Support\Facades\Route;

Route::get('/', CvController::class)->name('home');
Route::get('/cv', CvController::class)->name('cv');
Route::redirect('/about', '/', 301);
Route::redirect('/notes', '/', 301);
