@extends('layouts.app')

@section('title', 'Lindsay Masten — Designer, Educator, Academic Leader')

@section('content')
<section class="cover" aria-labelledby="cover-name">
    <h1 class="cover__name" id="cover-name">Lindsay Masten</h1>
    <p class="cover__role">Designer<br>Educator<br>Academic leader</p>
    <p class="cover__place">Prescott, Arizona<br>34.5400° N / 112.4685° W</p>
    <p class="cover__vertical cover__vertical--left">Visual communication / academic form / public life</p>
    <p class="cover__vertical cover__vertical--right">Web &amp; Wolf / Yavapai College / 2018—2026</p>

    <div class="specimen" data-specimen aria-label="Abstracted fragments of design work by Lindsay Masten">
        <div class="specimen__dots" aria-hidden="true"></div>
        <figure class="specimen__piece specimen__piece--one">
            <img src="{{ asset('images/fragment-district8-archive.jpg') }}" alt="" width="1024" height="1536">
        </figure>
        <figure class="specimen__piece specimen__piece--two">
            <img src="{{ asset('images/fragment-district8-archive.jpg') }}" alt="" width="1024" height="1536">
        </figure>
        <figure class="specimen__piece specimen__piece--three">
            <img src="{{ asset('images/fragment-district8-archive.jpg') }}" alt="" width="1024" height="1536">
        </figure>
        <figure class="specimen__piece specimen__piece--four">
            <img src="{{ asset('images/fragment-district8-archive.jpg') }}" alt="" width="1024" height="1536">
        </figure>
        <div class="specimen__mask specimen__mask--one" aria-hidden="true"></div>
        <div class="specimen__mask specimen__mask--two" aria-hidden="true"></div>
        <span class="specimen__register" aria-hidden="true">＋</span>
    </div>

    <p class="cover__caption">A working record of design, education, institutional leadership, and the systems connecting them.</p>
    <p class="cover__folio">Plate 01 / 06</p>
    <a class="cover__cv" href="{{ route('cv') }}">Curriculum vitae ↗</a>
    <a class="cover__down" href="#profile" aria-label="Continue to profile">↓</a>
</section>

<section class="tea-plate" id="profile" aria-labelledby="profile-title">
    <p class="tea-plate__edge tea-plate__edge--left">Lindsay Masten / visual systems / education / institutions</p>
    <p class="tea-plate__edge tea-plate__edge--right">Prescott, Arizona / active record / 2026</p>

    <div class="tea-plate__header">
        <p class="tea-plate__code">LM / 02<br>34°32′N<br>112°28′W</p>
        <h2 id="profile-title">Design is a way of arranging attention—what appears, in what order, and who can enter.</h2>
        <p class="tea-plate__intro">Lindsay Masten is a designer, educator, and academic leader working across visual communication, digital experience, curriculum, and institutional change. Her practice joins close formal judgment with the structures that shape how people learn and participate.</p>
        <p class="tea-plate__note">She is Professor of Graphic Design &amp; New Art and Chair of Visual Arts at Yavapai College; Partner and Creative Director at Web &amp; Wolf.</p>
    </div>

    <div class="tea-plate__appointments" aria-label="Current appointments">
        <p><span>2022—</span> Yavapai College<br>Professor / Department Chair</p>
        <p><span>2018—</span> Web &amp; Wolf<br>Partner / Creative Director</p>
        <p><span>Fall 2026</span> Bachelor of Design<br>Visual Design / Program launch</p>
    </div>

    <svg class="tea-plate__figure" viewBox="0 0 900 600" role="img" aria-labelledby="tea-figure-title">
        <title id="tea-figure-title">An abstract network of rounded lines and dots representing connected fields of practice</title>
        <g class="tea-plate__nodes">
            <circle cx="90" cy="70" r="25"/><circle cx="240" cy="70" r="25"/><circle cx="390" cy="70" r="25"/><circle cx="540" cy="70" r="25"/><circle cx="690" cy="70" r="25"/><circle cx="840" cy="70" r="25"/>
            <circle cx="90" cy="200" r="25"/><circle cx="240" cy="200" r="25"/><circle cx="390" cy="200" r="25"/><circle cx="540" cy="200" r="25"/><circle cx="690" cy="200" r="25"/><circle cx="840" cy="200" r="25"/>
            <circle cx="90" cy="330" r="25"/><circle cx="240" cy="330" r="25"/><circle cx="390" cy="330" r="25"/><circle cx="540" cy="330" r="25"/><circle cx="690" cy="330" r="25"/><circle cx="840" cy="330" r="25"/>
            <circle cx="90" cy="460" r="25"/><circle cx="240" cy="460" r="25"/><circle cx="390" cy="460" r="25"/><circle cx="540" cy="460" r="25"/><circle cx="690" cy="460" r="25"/><circle cx="840" cy="460" r="25"/>
        </g>
        <g class="tea-plate__routes">
            <path d="M90 200H240V70"/><path d="M240 330V200H390"/><path d="M390 70V200H540"/>
            <path d="M540 330V70H690"/><path d="M690 460V330H840"/><path d="M90 460H390V330"/>
            <path d="M390 460H540V330"/><path d="M540 200H840"/>
        </g>
    </svg>

    <p class="tea-plate__legend">Teaching / authorship / systems / governance / practice / access</p>
    <p class="tea-plate__folio">Plate 02 / 06</p>
</section>

<section class="register" aria-label="Three registers of Lindsay Masten's work">
    <article class="register__item">
        <span class="register__number">01</span>
        <h2>Education</h2>
        <p>Typography, visual systems, web and interaction design, publication, packaging, accessibility, history, critique, and professional practice.</p>
        <span class="register__edge">Courses / Programs / Learning environments</span>
    </article>
    <article class="register__item register__item--inverse">
        <span class="register__number">02</span>
        <h2>Institution</h2>
        <p>Curriculum architecture, assessment, faculty coordination, academic policy, advising, accreditation support, governance, and civic service.</p>
        <span class="register__edge">Structure / Access / Policy</span>
    </article>
    <article class="register__item register__item--signal">
        <span class="register__number">03</span>
        <h2>Practice</h2>
        <p>Identity, packaging, digital products, editorial systems, websites, and integrated communications through Web &amp; Wolf.</p>
        <span class="register__edge">Type / Image / Interface</span>
    </article>
</section>

<section class="tree-field" aria-labelledby="tree-field-title">
    <svg class="tree-field__drawing" viewBox="0 0 1200 900" aria-hidden="true">
        <g class="tree-field__rings">
            <path d="M329 415c-86-72-45-198 61-229 108-31 236 66 213 178-22 110-193 160-274 51Z"/>
            <path d="M351 398c-68-58-33-157 52-181 86-25 185 52 167 140-17 87-154 127-219 41Z"/>
            <path d="M378 379c-47-40-22-108 36-124 58-17 128 36 115 97-12 60-106 87-151 27Z"/>
            <path d="M407 359c-25-22-12-59 20-68 32-9 69 20 62 52-6 33-57 47-82 16Z"/>
            <path d="M851 204c-55-45-29-127 39-145 69-18 152 43 138 114-13 70-126 100-177 31Z"/>
            <path d="M876 186c-33-28-17-77 24-88 42-11 92 26 84 69-9 42-77 60-108 19Z"/>
            <path d="M719 682c-71-59-38-165 50-189 89-24 196 56 178 147-17 90-162 130-228 42Z"/>
            <path d="M747 660c-48-40-25-111 34-127 60-17 132 37 120 99-12 60-110 87-154 28Z"/>
        </g>
        <path class="tree-field__trunk" d="M-80 815C188 710 258 539 439 363c126-123 271-155 460-187 143-24 247-83 380-190"/>
        <path class="tree-field__branch" d="M440 363C558 462 645 566 778 681M686 241C770 319 893 356 1088 336"/>
    </svg>

    <p class="tree-field__edge tree-field__edge--a">Architecture / sequence / proportion / circulation</p>
    <p class="tree-field__edge tree-field__edge--b">PRESCOTT 86301 / VISUAL ARTS / 03—06</p>
    <div class="tree-field__text">
        <h2 id="tree-field-title">Architecture remains present in the work.</h2>
        <p>Not as a visual manner, but as a method: establish a structure, understand movement through it, and make the threshold legible. Lindsay brings that thinking to interfaces, classrooms, curricula, departments, and publications.</p>
        <a href="{{ route('cv') }}">Read the full curriculum vitae ↗</a>
    </div>

    <div class="coral-index" aria-hidden="true">
        <span><i></i>A</span><span><i></i>T</span><span><i></i>T</span><span><i></i>N</span>
    </div>
    <p class="tree-field__folio">Plate 03 / 06</p>
</section>

<section class="work-field" aria-label="Abstracted visual material from Lindsay Masten's professional practice">
    <div class="reconstruction" style="--source-image: url('{{ asset('images/fragment-district8-archive.jpg') }}')" role="img" aria-label="A Lindsay Masten design image transformed into a torn pointillist reproduction, then reconstructed as offset rectangular fragments">
        <span class="reconstruction__slice reconstruction__slice--01"></span>
        <span class="reconstruction__slice reconstruction__slice--02"></span>
        <span class="reconstruction__slice reconstruction__slice--03"></span>
        <span class="reconstruction__slice reconstruction__slice--04"></span>
        <span class="reconstruction__slice reconstruction__slice--05"></span>
        <span class="reconstruction__slice reconstruction__slice--06"></span>
        <span class="reconstruction__slice reconstruction__slice--07"></span>
        <span class="reconstruction__slice reconstruction__slice--08"></span>
        <span class="reconstruction__slice reconstruction__slice--09"></span>
        <span class="reconstruction__slice reconstruction__slice--10"></span>
        <span class="reconstruction__slice reconstruction__slice--11"></span>
        <span class="reconstruction__slice reconstruction__slice--12"></span>
        <div class="pixel-band" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
    </div>

    <div class="work-field__caption">
        <span>Authored material / interrupted reproduction</span>
        <p>The image is treated as evidence rather than showcase: divided, re-registered, and withheld from a complete reading.</p>
        <p>Design and art direction<br>Web &amp; Wolf / 2018—</p>
    </div>
    <div class="work-field__grid" aria-hidden="true"></div>
    <p class="work-field__vertical">Fragment / crop / register / repeat</p>
    <span class="work-field__folio">Plate 04 / 06</span>
</section>

<section class="matters" id="matters">
    <ol class="matters__list">
        <li><span>01</span><p>AI literacy and authorship in design education</p><small>NISOD / 2026</small></li>
        <li><span>02</span><p>The course interface as part of the curriculum</p><small>UX research / 2026</small></li>
        <li><span>03</span><p>Accelerated design education without compressed thinking</p><small>B.Des / Fall 2026</small></li>
        <li><span>04</span><p>Editorial publishing across literature and visual art</p><small>Threshold / 2025—</small></li>
    </ol>
    <p class="matters__statement">The work is not organized by medium. It is organized by attention: what people encounter, in what order, with what degree of access, and toward what possibility.</p>
    <span class="matters__folio">Plate 05 / 06</span>
</section>
@endsection
