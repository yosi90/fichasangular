import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, fromEvent, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
    private static swalConfigurado = false;
    private readonly destroy$ = new Subject<void>();
    height: number = typeof window !== 'undefined' ? window.innerHeight : 0;
    width: number = typeof window !== 'undefined' ? window.innerWidth : 0;
    resize$: Observable<Event> = fromEvent(window, 'resize');

    async ngOnInit(): Promise<void> {
        this.configurarSwalGlobal();
        this.resize$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.height = window.innerHeight;
                this.width = window.innerWidth;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get isDesktopLayout(): boolean {
        return this.width > 1250 && this.height > 700 && this.height < this.width;
    }

    private configurarSwalGlobal(): void {
        if (AppComponent.swalConfigurado)
            return;

        const originalFire = (Swal.fire as any).bind(Swal);
        const baseConfig = {
            target: typeof document !== 'undefined' ? document.body : undefined,
            heightAuto: false,
            scrollbarPadding: false,
        };

        (Swal as any).fire = ((...args: any[]) => {
            if (args.length === 0)
                return originalFire(baseConfig);

            if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0]))
                return originalFire({ ...baseConfig, ...args[0] });

            if (args.length <= 3) {
                const [title, text, icon] = args;
                return originalFire({
                    ...baseConfig,
                    title,
                    text,
                    icon,
                });
            }

            return originalFire(...args);
        }) as typeof Swal.fire;

        AppComponent.swalConfigurado = true;
    }
}

