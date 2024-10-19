import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VerifyConnectionService {

    constructor(private http: HttpClient) { }

    verifyCon(): Observable<boolean> {
        return this.http.get(`${environment.apiUrl}verify`)
            .pipe(
                map(() => true),
                catchError(() => of(false))
            );
    }
}
