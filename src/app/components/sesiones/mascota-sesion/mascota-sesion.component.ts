import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom, take } from 'rxjs';
import Swal from 'sweetalert2';
import {
    SelectorCompaneroConfirmacion, SelectorCompaneroModalComponent,
} from 'src/app/components/nuevo-personaje/selector-companero-modal/selector-companero-modal.component';
import {
    SelectorFamiliarConfirmacion, SelectorFamiliarModalComponent,
} from 'src/app/components/nuevo-personaje/selector-familiar-modal/selector-familiar-modal.component';
import { HuecoDeSelectores } from 'src/app/components/sesiones/hueco-selectores';
import { MismaCuenta } from 'src/app/components/sesiones/misma-cuenta';
import { NivelQuePierdeComponent } from 'src/app/components/sesiones/nivel-que-pierde/nivel-que-pierde.component';
import { resolverLoQueEligeElCompanero } from 'src/app/components/sesiones/pasos-con-selectores';
import { RepartoRangosComponent } from 'src/app/components/sesiones/reparto-rangos/reparto-rangos.component';
import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import {
    CausaMascotaPerdida, EventoSesionDto, ExperienciaPersonaje, MascotaPerdida, SalvacionMascota, SesionPersonaje, TipoDeMascota,
} from 'src/app/interfaces/sesiones';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { MotorDesdeFichaService } from 'src/app/services/motor-desde-ficha.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { SesionesService } from 'src/app/services/sesiones.service';
import { AccionMascota, SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { daDotePorNivelDePersonaje } from 'src/app/services/utils/clase-niveles';
import { claveCompanero, construirCatalogoCompanerosDesdeMonstruos, entradasDelSelectorCompanero } from 'src/app/services/utils/companero-reglas';
import { claveFamiliar, construirCatalogoFamiliaresDesdeMonstruos, entradasDelSelectorFamiliar } from 'src/app/services/utils/familiar-reglas';
import { FilaDeLaMascota, filasDeLasMascotas } from 'src/app/services/utils/mascota-al-dia';
import {
    CAUSAS_DE_PERDER, costeDeLaMascota, CosteDeLaMascotaEnLaSesion, fichaSinLaMascota, fortalezaDelPersonaje, fuentesDeLaMascota,
    leBajaUnNivel, mascotaDeLaFicha, nombrePropioDeLaMascota, perdidaDeLaMascota, pxTrasPerderLaMascota, TEXTOS_MASCOTA,
    TextosMascotaEnLaSesion, tirarFortaleza,
} from 'src/app/services/utils/mascota-sesion';
import { toInt } from 'src/app/services/utils/normalizacion';
import {
    caracteristicaMasAlta, clasesQuePuedenPerder, doteDeLaClave, dotesQuePuedePerder, FilaPerdida, filasDelNivelPerdido,
    indiceDelNivelQueSePierde, nombresDeLaFicha, ordenPorConocer, perdidaDelNivel,
} from 'src/app/services/utils/perder-nivel';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { formatoPx } from 'src/app/services/utils/sesiones-texto';

type PasoObtener = 'inicio' | 'rangos' | 'resumen';

/**
 * La mascota fuera del reciclaje (contrato: `personajes.md`, «La mascota fuera del reciclaje»; SESIONES_FRONT, «La mascota
 * fuera del reciclaje»), en su pestaña, desde el panel de la sesión abierta:
 * - **perder** (`mascota_perdida`): el compañero se libera o muere; el familiar muere o se abandona, con la salvación de
 *   Fortaleza que apunta quien juega («Tirar» es una ayuda: d20 + Fortaleza) y los PX que pierde (los de su aptitud por cada
 *   nivel de las clases que se lo dan, la mitad si la supera). Si le bajan del nivel que le dan sus PX, la ficha sin el último
 *   nivel que ganó (la regla de «Perder un nivel» con la causa `experiencia`) y sin el familiar;
 * - **obtener** (`mascota_obtenida`): otra con el hueco vacío, con el selector de la creación y, del compañero, lo que elige
 *   con sus DG adicionales (rangos, mejoras, dotes y trucos); el familiar cuesta sus po (o las paga otro) y, si el último
 *   murió o se abandonó, confirmar el año y un día.
 * Usa el motor de la creación en su propia instancia (`MotorDesdeFichaService`).
 */
@Component({
    selector: 'app-mascota-sesion',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, NivelQuePierdeComponent, RepartoRangosComponent],
    templateUrl: './mascota-sesion.component.html',
    styleUrls: ['../subir-nivel/subir-nivel.component.sass'],
    providers: [NuevoPersonajeService],
})
export class MascotaSesionComponent implements OnInit, OnDestroy {
    @Input() idPersonaje = 0;
    @Input() accion: AccionMascota = 'perder';
    @Input() mascota: TipoDeMascota = 'familiar';
    /** Lo que hace la pestaña al terminar o cancelar (la cierra). */
    @Input() alTerminar: (() => void) | null = null;

    @ViewChild('modalHost', { read: ViewContainerRef }) modalHost?: ViewContainerRef;

    cargando = true;
    guardando = false;
    eligiendo = false;
    error = '';
    pj: Personaje | null = null;
    sesion: SesionPersonaje | null = null;
    experiencia: ExperienciaPersonaje | null = null;
    entrada: PersonajeCreateRequestDto | null = null;
    perdida: MascotaPerdida | null = null;
    coste: CosteDeLaMascotaEnLaSesion | null = null;

    // Perder
    causa: CausaMascotaPerdida = 'muerte';
    salvacion: SalvacionMascota | null = null;
    tirada: { d20: number; total: number; } | null = null;
    concepto = '';
    idClaseElegida: number | null = null;
    doteElegida = '';
    filasPerdida: FilaPerdida[] = [];
    impedimento = '';
    private fichaSinNivel: PersonajeCreateRequestDto | null = null;

    // Obtener
    paso: PasoObtener = 'inicio';
    plazoCumplido = false;
    poPagadasPorOtro = false;
    filasObtener: FilaDeLaMascota[] = [];
    nombreElegido = '';
    private cuerpo: PersonajeCreateRequestDto | null = null;

    private readonly cuenta: MismaCuenta;
    private readonly selectores = new HuecoDeSelectores(() => this.modalHost);

    constructor(
        public svc: NuevoPersonajeService,
        auth: Auth,
        private sesionesSvc: SesionesService,
        private puerta: SubidaNivelPuertaService,
        private motor: MotorDesdeFichaService,
        private monstruoSvc: MonstruoService,
    ) {
        this.cuenta = new MismaCuenta(auth);
    }

    ngOnInit(): void {
        this.causa = CAUSAS_DE_PERDER[this.mascota][0].valor;
        void this.cargar();
    }

    ngOnDestroy(): void {
        this.cuenta.destruir();
        this.selectores.cerrar();
    }

    get textos(): TextosMascotaEnLaSesion {
        return TEXTOS_MASCOTA[this.mascota];
    }

    get causas(): ReadonlyArray<{ valor: CausaMascotaPerdida; nombre: string; }> {
        return CAUSAS_DE_PERDER[this.mascota];
    }

    get laMascota(): CompaneroMonstruoDetalle | FamiliarMonstruoDetalle | null {
        return mascotaDeLaFicha(this.pj, this.mascota);
    }

    get nombreDeLaMascota(): string {
        return nombrePropioDeLaMascota(this.pj, this.mascota);
    }

    get titulo(): string {
        if (this.accion === 'obtener')
            return this.textos.obtener;
        return this.mascota === 'companero' ? 'Perder el compañero animal' : 'Perder el familiar';
    }

    px(valor: number): string {
        return formatoPx(valor);
    }

    precio(valor: number): string {
        return textoPrecio(valor);
    }

    get pxActuales(): number {
        return toInt(this.experiencia?.px);
    }

    /** Los PX que le quedan tras perder el familiar (el compañero no cuesta PX). */
    get pxDespues(): number {
        return this.mascota === 'familiar' ? pxTrasPerderLaMascota(this.pxActuales, this.coste?.tarifa ?? 0, this.salvacion) : this.pxActuales;
    }

    get bajaNivel(): boolean {
        return this.mascota === 'familiar' && !!this.salvacion && leBajaUnNivel(this.pxActuales, this.pxDespues);
    }

    get cd(): number {
        return this.coste?.cd ?? 15;
    }

    get sinOrden(): boolean {
        return ordenPorConocer(this.entrada?.niveles);
    }

    get clases(): Array<{ id: number; nombre: string; nivel: number; }> {
        return clasesQuePuedenPerder(this.svc, this.entrada);
    }

    get pideDote(): boolean {
        return this.sinOrden && daDotePorNivelDePersonaje(toInt(this.pj?.Nivel_personaje));
    }

    get dotes(): Array<{ clave: string; nombre: string; }> {
        return dotesQuePuedePerder(this.pj);
    }

    /** El plazo que pide confirmar (el familiar muerto o abandonado: «un año y un día»), o `null`. */
    get plazo(): string | null {
        return this.accion === 'obtener' ? this.perdida?.esperaReemplazo ?? null : null;
    }

    // --- Carga ---------------------------------------------------------------------------------------------------------

    private async cargar(): Promise<void> {
        this.cargando = true;
        this.error = '';
        this.cuenta.fijar();
        try {
            const leida = await this.motor.cargarSesionDeJuego(this.svc, this.idPersonaje, () => this.cuenta.sigue(), {
                sinPermiso: 'Solo su dueño o el máster de su campaña pueden apuntar lo de su mascota.',
                sinSesion: 'Para apuntarlo hace falta una sesión de juego abierta: ábrela desde el historial.',
            }, { alLeer: (historial) => this.experiencia = historial.experiencia });
            if (!leida)
                return;
            const { cargada } = leida;
            this.sesion = cargada.sesion;
            this.entrada = cargada.entrada;
            this.pj = cargada.pj;
            this.perdida = perdidaDeLaMascota(cargada.mascotasPerdidas, this.mascota);
            await this.motor.hidratar(this.svc, this.pj, this.entrada, cargada.nivelesPerdidos);
            if (!this.cuenta.sigue())
                return;
            this.coste = costeDeLaMascota(fuentesDeLaMascota(this.pj, this.svc.CatalogoClases, this.mascota));
            if (this.accion === 'perder') {
                if (!this.laMascota)
                    throw new Error(`El personaje no tiene ${this.textos.que}.`);
                this.idClaseElegida = this.sinOrden ? this.clases[this.clases.length - 1]?.id ?? null : null;
                this.recalcularPerdida();
            } else if (this.laMascota) {
                throw new Error(this.mascota === 'companero'
                    ? `Ya tiene un compañero animal, «${this.nombreDeLaMascota}»: para llamar a otro, libéralo antes (Manual del jugador, pág. 35).`
                    : `Ya tiene un familiar, «${this.nombreDeLaMascota}»: para tener otro, abandónalo antes (Manual del jugador, pág. 45).`);
            } else if (this.cupos() < 1) {
                throw new Error(`Ninguna de sus clases le da ahora un ${this.textos.que}.`);
            }
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido preparar la ficha.';
        } finally {
            this.cargando = false;
        }
    }

    private cupos(): number {
        return toInt((this.mascota === 'companero' ? this.svc.getEstadoCuposCompanero() : this.svc.getEstadoCuposFamiliar()).cuposDisponibles);
    }

    // --- Perder --------------------------------------------------------------------------------------------------------

    elegirCausa(valor: string): void {
        this.causa = this.causas.find((c) => c.valor === valor)?.valor ?? this.causas[0].valor;
        this.recalcularPerdida();
    }

    elegirSalvacion(valor: SalvacionMascota): void {
        this.salvacion = valor;
        this.recalcularPerdida();
    }

    /** «Tirar»: una ayuda (d20 + su Fortaleza contra la CD); lo que cuenta es lo que se apunta. */
    tirar(): void {
        const t = tirarFortaleza(fortalezaDelPersonaje(this.pj), this.cd);
        this.tirada = { d20: t.d20, total: t.total };
        this.elegirSalvacion(t.salvacion);
    }

    elegirClase(id: string): void {
        this.idClaseElegida = toInt(id) || null;
        this.recalcularPerdida();
    }

    elegirDote(clave: string): void {
        this.doteElegida = clave;
        this.recalcularPerdida();
    }

    /** Lo que pierde: la mascota, los PX y, si le bajan del nivel que le dan, el último nivel que ganó. */
    recalcularPerdida(): void {
        this.filasPerdida = [];
        this.impedimento = '';
        this.fichaSinNivel = null;
        const entrada = this.entrada;
        if (!entrada || !this.laMascota)
            return;
        const filas: FilaPerdida[] = [{
            que: this.textos.etiqueta,
            antes: this.nombreDeLaMascota,
            ahora: this.causa === 'liberacion' ? 'Liberado' : this.causa === 'abandono' ? 'Abandonado' : 'Muerto',
        }];
        if (this.mascota === 'familiar') {
            if (!this.salvacion) {
                this.filasPerdida = filas;
                return;
            }
            filas.push({ que: 'PX', antes: this.px(this.pxActuales), ahora: this.px(this.pxDespues) });
        }
        if (this.bajaNivel) {
            const indice = indiceDelNivelQueSePierde(entrada.niveles, this.idClaseElegida);
            if (indice === null) {
                this.impedimento = 'Elige la clase que pierde el nivel.';
                return;
            }
            const conMascota = this.motor.cuerpoDelMotor(this.svc, entrada);
            const { resultado, filaDelNivel } = perdidaDelNivel(this.svc, this.motor, {
                entrada, indice, dgs: toInt(this.pj?.Nivel_personaje), incremento: this.sinOrden ? caracteristicaMasAlta(entrada) : null,
                dote: this.pideDote ? doteDeLaClave(this.doteElegida) : null,
            });
            // Lo que daba el familiar al amo, del motor sin él (Alerta con su origen, sus aptitudes de amo).
            const estado = this.svc.exportarEstadoSubida();
            try {
                this.svc.quitarFamiliar();
                const sinMascota = this.motor.cuerpoDelMotor(this.svc, entrada);
                this.fichaSinNivel = fichaSinLaMascota(resultado.ficha, conMascota, sinMascota, 'familiar');
            } finally {
                this.svc.restaurarEstadoSubida(estado);
            }
            filas.push(filaDelNivel, { que: 'Puntos de golpe', antes: `${resultado.pg.antes}`, ahora: `${resultado.pg.despues}${resultado.pg.exacto ? '' : ' (aproximado)'}` });
            filas.push(...filasDelNivelPerdido(resultado, nombresDeLaFicha(this.svc, this.pj, entrada)));
        }
        this.filasPerdida = filas;
    }

    get puedePerder(): boolean {
        return !this.guardando && !this.impedimento && this.filasPerdida.length > 0
            && (this.mascota !== 'familiar' || !!this.salvacion) && (!this.bajaNivel || !!this.fichaSinNivel)
            && (!this.bajaNivel || !this.pideDote || !!this.doteElegida);
    }

    async perder(): Promise<void> {
        if (!this.puedePerder || !this.sesion)
            return;
        const r = await Swal.fire({
            icon: 'warning', title: this.titulo,
            text: this.bajaNivel
                ? 'Pierde la mascota, los PX y el último nivel que ganó, como se ve en la lista. Se puede deshacer mientras la sesión siga abierta.'
                : 'Pierde la mascota con lo que le daba. Se puede deshacer mientras la sesión siga abierta.',
            showCancelButton: true, confirmButtonText: 'Apuntarlo', cancelButtonText: 'Volver',
            target: document.body, heightAuto: false, scrollbarPadding: false,
        });
        if (!r.isConfirmed)
            return;
        const concepto = this.concepto.trim();
        await this.apuntar({
            tipo: 'mascota_perdida', mascota: this.mascota, causa: this.causa,
            ...(this.mascota === 'familiar' && this.salvacion ? { salvacion: this.salvacion } : {}),
            ...(concepto ? { concepto } : {}),
            ...(this.bajaNivel && this.fichaSinNivel ? { ficha: this.fichaSinNivel } : {}),
            ...(this.bajaNivel && this.sinOrden && this.idClaseElegida ? { idClase: this.idClaseElegida } : {}),
        }, 'No se ha podido apuntar la pérdida de la mascota.');
    }

    // --- Obtener -------------------------------------------------------------------------------------------------------

    /** El selector de la creación (las listas a su nivel efectivo de ahora); del compañero, después lo que elige con sus DG. */
    async elegirMascota(): Promise<void> {
        if (this.eligiendo || !this.pj)
            return;
        this.eligiendo = true;
        this.error = '';
        try {
            const monstruos = await firstValueFrom(this.monstruoSvc.getMonstruos().pipe(take(1)));
            const registrada = this.mascota === 'companero'
                ? await this.elegirCompanero(construirCatalogoCompanerosDesdeMonstruos(monstruos ?? []))
                : await this.elegirFamiliar(construirCatalogoFamiliaresDesdeMonstruos(monstruos ?? []));
            if (!registrada)
                return;
            if (this.mascota === 'companero' && this.svc.iniciarDistribucionHabilidadesCompanero('clases')) {
                this.paso = 'rangos';
                return;
            }
            if (this.mascota === 'companero')
                await resolverLoQueEligeElCompanero(this.svc, this.selectores);
            this.prepararResumen();
        } catch (error: any) {
            this.error = `${error?.message ?? ''}`.trim() || 'No se ha podido cargar la lista de criaturas.';
        } finally {
            this.eligiendo = false;
        }
    }

    async cerrarRangos(): Promise<void> {
        if (!this.svc.puedeCerrarDistribucionHabilidades())
            return;
        this.svc.cerrarDistribucionHabilidades();
        this.eligiendo = true;
        try {
            await resolverLoQueEligeElCompanero(this.svc, this.selectores);
        } finally {
            this.eligiendo = false;
        }
        this.prepararResumen();
    }

    private get conHomebrew(): boolean {
        return this.pj?.Oficial === false;
    }

    private async elegirCompanero(catalogo: CompaneroMonstruoDetalle[]): Promise<boolean> {
        const estado = this.svc.getEstadoCuposCompanero();
        let homebrew = this.conHomebrew;
        let nivel: number | null = null;
        const entradas = () => {
            const e = entradasDelSelectorCompanero({
                companeros: catalogo, estado, alineamientoPersonaje: `${this.pj?.Alineamiento ?? ''}`.trim(), incluirHomebrew: homebrew,
                dotesPersonaje: this.svc.idsDotesDelPersonaje(), nivelSeleccionado: nivel,
            });
            nivel = e.nivelSeleccionado;
            return {
                companerosElegibles: e.elegibles, companerosBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos, ajustes: e.ajustes,
                nivelesDisponibles: e.nivelesDisponibles, nivelSeleccionado: e.nivelSeleccionado, incluirHomebrew: homebrew,
            };
        };
        const seleccion = await this.selectores.abrir<SelectorCompaneroConfirmacion>(SelectorCompaneroModalComponent, {
            titulo: TEXTOS_MASCOTA.companero.obtener, cuposDisponibles: Math.max(0, toInt(estado.cuposDisponibles)), nombreCompanero: '', ...entradas(),
        }, ['confirmar'], ['omitir'], {}, {
            incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
            nivelChange: (valor: number | null) => { nivel = valor; return entradas(); },
            nombreCompaneroChange: (valor: string) => ({ nombreCompanero: `${valor ?? ''}` }),
        });
        const companero = seleccion ? catalogo.find((c) => claveCompanero(c) === claveCompanero(seleccion.companero)) : null;
        if (!companero || !seleccion)
            return false;
        const r = this.svc.registrarCompaneroSeleccionado(companero, seleccion.nombre);
        if (!r.registrado)
            throw new Error(r.razon || 'No se ha podido poner el compañero animal.');
        this.nombreElegido = `${seleccion.nombre || companero.Nombre || ''}`.trim();
        return true;
    }

    private async elegirFamiliar(catalogo: FamiliarMonstruoDetalle[]): Promise<boolean> {
        const estado = this.svc.getEstadoCuposFamiliar();
        let homebrew = this.conHomebrew;
        let plantilla: number | null = null;
        const entradas = () => {
            const e = entradasDelSelectorFamiliar({
                familiares: catalogo, estado, alineamientoPersonaje: `${this.pj?.Alineamiento ?? ''}`.trim(), plantillaSeleccionada: plantilla,
                incluirHomebrew: homebrew, dotesPersonaje: this.svc.idsDotesDelPersonaje(),
            });
            return {
                familiaresElegibles: e.elegibles, familiaresBloqueados: e.bloqueados, nivelesRequeridos: e.nivelesRequeridos,
                plantillasDisponibles: e.plantillas, plantillaSeleccionada: plantilla, incluirHomebrew: homebrew,
            };
        };
        const seleccion = await this.selectores.abrir<SelectorFamiliarConfirmacion>(SelectorFamiliarModalComponent, {
            titulo: TEXTOS_MASCOTA.familiar.obtener, cuposDisponibles: Math.max(0, toInt(estado.cuposDisponibles)), nombreFamiliar: '', ...entradas(),
        }, ['confirmar'], ['omitir'], {}, {
            incluirHomebrewChange: (valor: boolean) => { homebrew = !!valor; return entradas(); },
            plantillaChange: (valor: number | null) => { plantilla = valor === null || valor === undefined ? null : toInt(valor) || null; return entradas(); },
            nombreFamiliarChange: (valor: string) => ({ nombreFamiliar: `${valor ?? ''}` }),
        });
        const familiar = seleccion ? catalogo.find((c) => claveFamiliar(c) === claveFamiliar(seleccion.familiar)) : null;
        if (!familiar || !seleccion)
            return false;
        const r = this.svc.registrarFamiliarSeleccionado(familiar, seleccion.nombre);
        if (!r.registrado)
            throw new Error(r.razon || 'No se ha podido poner el familiar.');
        this.nombreElegido = `${seleccion.nombre || familiar.Nombre || ''}`.trim();
        return true;
    }

    private prepararResumen(): void {
        if (!this.entrada)
            return;
        this.cuerpo = this.motor.cuerpoDelMotor(this.svc, this.entrada);
        this.filasObtener = filasDeLasMascotas(this.entrada, this.cuerpo, {}, this.svc.nombresDeLoQueEligeLaMascota());
        this.paso = 'resumen';
    }

    get puedeObtener(): boolean {
        const bloque = this.mascota === 'companero' ? this.cuerpo?.companero : this.cuerpo?.familiar;
        return this.paso === 'resumen' && !this.guardando && !!bloque && (!this.plazo || this.plazoCumplido)
            && (this.mascota !== 'familiar' || this.poPagadasPorOtro || (this.coste?.po ?? 0) <= this.saldo);
    }

    get saldo(): number {
        return Number(this.pj?.Dinero?.po ?? 0);
    }

    async obtener(): Promise<void> {
        if (!this.puedeObtener || !this.cuerpo)
            return;
        const concepto = this.concepto.trim();
        const bloque = this.mascota === 'companero' ? { companero: this.cuerpo.companero } : { familiar: this.cuerpo.familiar };
        await this.apuntar({
            tipo: 'mascota_obtenida', mascota: this.mascota, ...bloque,
            ...(this.plazo ? { plazoCumplido: this.plazoCumplido } : {}),
            ...(this.mascota === 'familiar' && this.poPagadasPorOtro ? { poPagadasPorOtro: true } : {}),
            ...(concepto ? { concepto } : {}),
        }, `No se ha podido apuntar ${this.mascota === 'companero' ? 'el compañero animal nuevo' : 'el familiar nuevo'}.`);
    }

    /** Vuelve a empezar con la ficha guardada. */
    async empezarDeNuevo(): Promise<void> {
        this.selectores.cerrar();
        this.paso = 'inicio';
        this.filasObtener = [];
        this.cuerpo = null;
        await this.cargar();
    }

    // --- Guardar -------------------------------------------------------------------------------------------------------

    private async apuntar(evento: EventoSesionDto, frase: string): Promise<void> {
        if (!this.sesion)
            return;
        this.guardando = true;
        this.error = '';
        try {
            await this.sesionesSvc.apuntar(this.idPersonaje, this.sesion, evento);
            if (!this.cuenta.sigue())
                return;
            this.puerta.subidaHecha(this.idPersonaje);
            this.alTerminar?.();
        } catch (error: any) {
            if (this.cuenta.sigue())
                this.error = `${error?.message ?? ''}`.trim() || frase;
        } finally {
            this.guardando = false;
        }
    }

    cancelar(): void {
        this.alTerminar?.();
    }
}
