import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    UsuarioAclResponseDto,
    UsuarioListadoItemDto,
    UsuarioUpsertRequestDto,
    UsuarioUpsertResponseDto,
} from '../interfaces/usuarios-api';

@Injectable({
    providedIn: 'root'
})
export class UsuariosApiService {
    private readonly usuariosBaseUrl = `${environment.apiUrl}usuarios`;

    constructor(private http: HttpClient, private auth: Auth) { }

    async getAclByUid(uid: string): Promise<UsuarioAclResponseDto> {
        const uidNormalizado = `${uid ?? ''}`.trim();
        if (uidNormalizado.length < 1)
            throw new Error('UID inválido');

        try {
            return await firstValueFrom(
                this.http.get<UsuarioAclResponseDto>(`${this.usuariosBaseUrl}/acl/${encodeURIComponent(uidNormalizado)}`)
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo leer ACL de usuario desde API');
        }
    }

    async listUsers(): Promise<UsuarioListadoItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<UsuarioListadoItemDto[]>(this.usuariosBaseUrl)
            );
            return Array.isArray(response) ? response : [];
        } catch (error) {
            throw this.toApiError(error, 'No se pudo listar usuarios desde API');
        }
    }

    async upsertUser(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        try {
            return await firstValueFrom(
                this.http.post<UsuarioUpsertResponseDto>(this.usuariosBaseUrl, payload)
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo persistir usuario en API');
        }
    }

    async downloadUsersBackupZip(): Promise<string> {
        const actorUid = `${this.auth.currentUser?.uid ?? ''}`.trim();
        if (actorUid.length < 1)
            throw new Error('Sesión no iniciada');

        try {
            const response = await firstValueFrom(
                this.http.get(`${this.usuariosBaseUrl}/backup`, {
                    observe: 'response',
                    responseType: 'blob',
                    params: { uid: actorUid },
                    headers: { 'X-User-Uid': actorUid },
                })
            );
            const filename = this.resolveDownloadFilename(response, 'rol-backup.zip');
            const blob = response.body ?? new Blob([], { type: 'application/zip' });
            saveAs(blob, filename);
            return filename;
        } catch (error) {
            throw await this.toApiErrorAsync(error, 'No se pudo descargar el backup SQL');
        }
    }

    private toApiError(error: any, fallbackMessage: string): Error {
        if (error instanceof HttpErrorResponse) {
            const message = this.extractErrorMessage(error.error)
                || `${fallbackMessage} (HTTP ${error.status || '0'})`;
            return new Error(message);
        }
        return new Error(fallbackMessage);
    }

    private async toApiErrorAsync(error: any, fallbackMessage: string): Promise<Error> {
        if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
            try {
                const blobText = (await error.error.text()).trim();
                if (blobText.length > 0) {
                    try {
                        const parsed = JSON.parse(blobText);
                        const message = this.extractErrorMessage(parsed)
                            || `${fallbackMessage} (HTTP ${error.status || '0'})`;
                        return new Error(message);
                    } catch {
                        return new Error(blobText);
                    }
                }
            } catch {
                // Si falla la lectura del blob, se usa el fallback estándar.
            }
        }

        return this.toApiError(error, fallbackMessage);
    }

    private extractErrorMessage(errorBody: any): string {
        if (!errorBody)
            return '';

        if (typeof errorBody === 'string') {
            const message = errorBody.trim();
            return message.length > 0 ? message : '';
        }

        if (typeof errorBody === 'object') {
            const knownMessage = `${errorBody?.message ?? errorBody?.error ?? ''}`.trim();
            if (knownMessage.length > 0)
                return knownMessage;

            const firstEntry = Object.entries(errorBody as Record<string, any>)[0];
            if (!firstEntry)
                return '';

            const [key, value] = firstEntry;
            const valueText = `${value ?? ''}`.trim();
            if (valueText.length > 0)
                return `${key}: ${valueText}`;
            return `${key}`.trim();
        }

        return '';
    }

    private resolveDownloadFilename(response: HttpResponse<Blob>, fallback: string): string {
        const contentDisposition = `${response.headers.get('Content-Disposition') ?? ''}`.trim();
        if (contentDisposition.length < 1)
            return fallback;

        const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1]).trim() || fallback;
            } catch {
                return utf8Match[1].trim() || fallback;
            }
        }

        const asciiMatch = contentDisposition.match(/filename\s*=\s*"?([^\";]+)"?/i);
        return asciiMatch?.[1]?.trim() || fallback;
    }
}
