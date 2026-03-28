import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
    CreationAuditEventDetailDto,
    CreationAuditListFiltersDto,
    CreationAuditListResponseDto,
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
                this.http.get<UsuarioAclResponseDto>(`${this.usuariosBaseUrl}/acl/${encodeURIComponent(uidNormalizado)}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo leer ACL de usuario desde API');
        }
    }

    async listUsers(): Promise<UsuarioListadoItemDto[]> {
        try {
            const response = await firstValueFrom(
                this.http.get<UsuarioListadoItemDto[]>(this.usuariosBaseUrl, {
                    headers: await this.buildAuthHeaders(),
                })
            );
            return Array.isArray(response) ? response : [];
        } catch (error) {
            throw this.toApiError(error, 'No se pudo listar usuarios desde API');
        }
    }

    async listCreationAuditEvents(filters: CreationAuditListFiltersDto = {}): Promise<CreationAuditListResponseDto> {
        try {
            const response = await firstValueFrom(
                this.http.get<CreationAuditListResponseDto>(`${this.usuariosBaseUrl}/admin/creation-audit`, {
                    headers: await this.buildAuthHeaders(),
                    params: this.buildCreationAuditQueryParams(filters),
                })
            );
            return {
                items: Array.isArray(response?.items) ? response.items : [],
                total: this.toNonNegativeInt(response?.total, 0) ?? 0,
                limit: this.toNonNegativeInt(response?.limit, 25) ?? 25,
                offset: this.toNonNegativeInt(response?.offset, 0) ?? 0,
                hasMore: response?.hasMore === true,
            };
        } catch (error) {
            throw this.toApiError(error, 'No se pudo listar la auditoría de creaciones');
        }
    }

    async getCreationAuditEventDetail(eventId: string): Promise<CreationAuditEventDetailDto> {
        const normalizedEventId = `${eventId ?? ''}`.trim();
        if (normalizedEventId.length < 1)
            throw new Error('Evento de auditoría inválido');

        try {
            return await firstValueFrom(
                this.http.get<CreationAuditEventDetailDto>(`${this.usuariosBaseUrl}/admin/creation-audit/${encodeURIComponent(normalizedEventId)}`, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo cargar el detalle de auditoría');
        }
    }

    async upsertUser(payload: UsuarioUpsertRequestDto): Promise<UsuarioUpsertResponseDto> {
        try {
            return await firstValueFrom(
                this.http.post<UsuarioUpsertResponseDto>(this.usuariosBaseUrl, payload, {
                    headers: await this.buildAuthHeaders(),
                })
            );
        } catch (error) {
            throw this.toApiError(error, 'No se pudo persistir usuario en API');
        }
    }

    async downloadUsersBackupZip(): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.http.get(`${this.usuariosBaseUrl}/backup`, {
                    observe: 'response',
                    responseType: 'blob',
                    headers: await this.buildAuthHeaders(),
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

    private buildCreationAuditQueryParams(filters: CreationAuditListFiltersDto): Record<string, string> {
        const params: Record<string, string> = {};

        const actorUid = `${filters?.actorUid ?? ''}`.trim();
        if (actorUid.length > 0)
            params['actorUid'] = actorUid;

        const actionCode = `${filters?.actionCode ?? ''}`.trim();
        if (actionCode.length > 0)
            params['actionCode'] = actionCode;

        const result = `${filters?.result ?? ''}`.trim();
        if (result.length > 0)
            params['result'] = result;

        const resourceType = `${filters?.resourceType ?? ''}`.trim();
        if (resourceType.length > 0)
            params['resourceType'] = resourceType;

        const from = `${filters?.from ?? ''}`.trim();
        if (from.length > 0)
            params['from'] = from;

        const to = `${filters?.to ?? ''}`.trim();
        if (to.length > 0)
            params['to'] = to;

        const limit = this.toNonNegativeInt(filters?.limit, null);
        if (limit !== null)
            params['limit'] = `${limit}`;

        const offset = this.toNonNegativeInt(filters?.offset, null);
        if (offset !== null)
            params['offset'] = `${offset}`;

        return params;
    }

    private toNonNegativeInt(value: any, fallback: number | null): number | null {
        const parsed = Math.trunc(Number(value));
        if (!Number.isFinite(parsed) || parsed < 0)
            return fallback;
        return parsed;
    }

    private async buildAuthHeaders(): Promise<HttpHeaders> {
        const user = this.auth.currentUser;
        if (!user)
            throw new Error('Sesión no iniciada');

        const idToken = await user.getIdToken();
        if (`${idToken ?? ''}`.trim().length < 1)
            throw new Error('Token no disponible');

        return new HttpHeaders({
            Authorization: `Bearer ${idToken}`,
        });
    }
}
