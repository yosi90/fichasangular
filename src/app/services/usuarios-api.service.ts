import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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

    constructor(private http: HttpClient) { }

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

    private toApiError(error: any, fallbackMessage: string): Error {
        if (error instanceof HttpErrorResponse) {
            const message = this.extractErrorMessage(error.error)
                || `${fallbackMessage} (HTTP ${error.status || '0'})`;
            return new Error(message);
        }
        return new Error(fallbackMessage);
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
}
