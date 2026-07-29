<?php

namespace Tests\Feature;

use Tests\TestCase;

class SiteTest extends TestCase
{
    public function test_public_pages_are_available(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('Curriculum Vitae')
            ->assertSee('Lindsay Masten');
        $this->get('/about')->assertRedirect('/');
        $this->get('/notes')->assertRedirect('/');
        $this->get('/cv')->assertOk()->assertSee('ACADEMIC APPOINTMENTS');
    }

    public function test_cv_contains_lindsays_current_roles(): void
    {
        $this->get('/cv')
            ->assertSee('Professor of Graphic Design &amp; New Art', false)
            ->assertSee('Department Chair, Visual Arts Department')
            ->assertSee('Partner and Creative Director')
            ->assertSee('href="https://readthreshold.org/"', false)
            ->assertSee('readthreshold.org');
    }

    public function test_cv_entries_are_rendered_with_the_editorial_date_column(): void
    {
        $this->get('/')
            ->assertSee('class="cv-entry-heading"', false)
            ->assertSee('class="cv-entry-heading__date">2025–Present', false)
            ->assertSee('id="academic-appointments"', false);
    }

    public function test_ink_octopus_is_isolated_and_accessible(): void
    {
        $this->get('/')
            ->assertSee('data-ink-octopus', false)
            ->assertSee('data-octopus-canvas', false)
            ->assertSee('aria-hidden="true"', false)
            ->assertSee('data-octopus-toggle', false)
            ->assertSee('aria-label="Put the octopus away"', false)
            ->assertSee('aria-pressed="false"', false);
    }
}
