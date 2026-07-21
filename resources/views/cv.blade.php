@extends('layouts.app')

@section('title', 'Curriculum Vitae — Lindsay Masten')

@section('content')
<header class="cv-masthead cv-grid" id="top">
    <a class="cv-masthead__title" href="#top" aria-label="Return to the top of the curriculum vitae">Curriculum Vitae</a>

    <div class="cv-masthead__tools">
        <details class="cv-index" data-cv-index>
            <summary>Contents</summary>
            <nav aria-label="Curriculum vitae sections">
                @foreach ($sections as $section)
                    <a href="#{{ $section['id'] }}">{{ $section['label'] }}</a>
                @endforeach
            </nav>
        </details>
        <a href="mailto:hello@lindsaymasten.com">Email</a>
    </div>
</header>

<main id="main-content">
    <section class="cv-intro cv-grid" aria-labelledby="cv-name">
        <div class="cv-intro__content">
            <h1 id="cv-name">Lindsay Masten</h1>
            <p class="cv-intro__roles">Professor of Graphic Design &amp; New Art<br>Chair, Visual Arts Department, Yavapai College<br>Partner and Creative Director, Web &amp; Wolf</p>
            <address class="cv-intro__contact">
                <span>Also find me at</span>
                <a class="cv-intro__agency" href="https://webandwolf.com/" rel="external">
                    <span>webandwolf.com</span>
                    <img src="{{ asset('webandwolf-favicon.svg') }}" alt="" width="24" height="24">
                </a>
            </address>
        </div>
    </section>

    <div class="cv-grid cv-body-grid">
        <article class="cv-manuscript" aria-label="Curriculum vitae">
            {!! $cv !!}
        </article>
    </div>
</main>

<footer class="cv-footer cv-grid">
    <p>Lindsay Masten <span aria-hidden="true">✣</span> Curriculum Vitae</p>
    <a href="#top">Top ↑</a>
</footer>
@endsection
