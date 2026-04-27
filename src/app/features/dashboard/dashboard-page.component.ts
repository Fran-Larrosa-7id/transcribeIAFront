import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <app-page-header
      eyebrow="AudioText AI"
      title="Transcribi audios largos con una experiencia clara de punta a punta"
      description="Creá trabajos de transcripción, seguí el progreso y consultá resultados listos para copiar o exportar."
      actionLabel="Nueva transcripción"
      actionLink="/transcriptions/new"
    />

    <section class="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="grid gap-6 md:grid-cols-2">
          @for (benefit of benefits; track benefit.title) {
            <article class="rounded-xl border border-slate-200 p-5">
              <div class="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600" aria-hidden="true">
                {{ benefit.icon }}
              </div>
              <h2 class="mt-4 text-lg font-semibold text-slate-950">{{ benefit.title }}</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ benefit.description }}</p>
            </article>
          }
        </div>
      </div>

      <aside class="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <p class="text-sm font-semibold text-indigo-200">Flujo preparado</p>
        <h2 class="mt-3 text-2xl font-bold">Subir, procesar, revisar y exportar</h2>
        <p class="mt-4 text-sm leading-6 text-slate-300">
          Los audios largos pueden tardar varios minutos en procesarse. Podés cerrar esta pantalla y volver al historial cuando esté listo.
        </p>
        <a
          routerLink="/transcriptions"
          class="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Ver historial
        </a>
      </aside>
    </section>
  `,
})
export class DashboardPageComponent {
  protected readonly benefits = [
    {
      icon: '4h+',
      title: 'Audios largos',
      description: 'Interfaz pensada para archivos extensos sin intentar procesarlos en el navegador.',
    },
    {
      icon: 'IA',
      title: 'Transcripción con IA',
      description: 'Opciones de modelo económico o alta precisión, preparadas para distintos niveles de calidad y costo.',
    },
    {
      icon: 'EX',
      title: 'Exportación',
      description: 'Acciones visuales para TXT, DOCX, PDF y SRT, hoy conectadas a placeholders.',
    },
    {
      icon: 'HI',
      title: 'Historial',
      description: 'Seguimiento de estados, progreso y detalle por cada trabajo de transcripción.',
    },
  ] as const;
}
