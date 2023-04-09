import { Component, OnInit } from '@angular/core';
import { Observable, fromEvent } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
    height!: number;
    width!: number;
    resize$: Observable<Event> = fromEvent(window, 'resize');

    async ngOnInit(): Promise<void> {
        this.height = window.innerHeight;
        this.width = window.innerWidth;
        (this.resize$).subscribe(() => {
            this.height = window.innerHeight;
            this.width = window.innerWidth;
        });
    }
}

