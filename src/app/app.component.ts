import { Component, OnInit } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
    private static swalConfigurado = false;
    height!: number;
    width!: number;
    resize$: Observable<Event> = fromEvent(window, 'resize');

    async ngOnInit(): Promise<void> {
        this.configurarSwalGlobal();
        this.height = window.innerHeight;
        this.width = window.innerWidth;
        (this.resize$).subscribe(() => {
            this.height = window.innerHeight;
            this.width = window.innerWidth;
        });
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

