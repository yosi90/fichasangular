import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Empleado } from 'src/app/@Clases/empleado.model';

@Component({
  selector: 'app-empleado',
  templateUrl: './empleado.component.html',
  styleUrls: ['./empleado.component.sass']
})

export class EmpleadoComponent {
  private nombre = 'pepe';
  private apellido = 'mikasa';
  private edad = 18;
  private empresa = 'lalo construcciones';
  e: Empleado = new Empleado("", "", 0, "");
  empleados: Array<Empleado> = [
    // new Empleado("Yosi", "González", 32, "Yosiftware")
  ];

  disableProperty = true;
  estadoRegistro = "Usuario no registrado";
  estadoEventoRegistro = "Usuario no registrado";

  public get Nombre() {
    return this.nombre;
  }

  public set Nombre(value: string) {
    this.nombre = value;
  }

  public get Apellido() {
    return this.apellido;
  }

  public set Apellido(value: string) {
    this.apellido = value;
  }

  public get Edad() {
    return this.edad;
  }

  public set Edad(value: number) {
    if (!isNaN(+value)) //el operador + seguido de una variable la convierte en número. la función isNaN devuelve true si encuentra un not a number (NaN)
      this.edad = value;
  }

  public get Empresa() {
    return this.empresa;
  }

  public set Empresa(value: string) {
    this.empresa = value;
  }

  cargaNombre(value: string) {
    this.Nombre = value != '' ? value : 'Pepe';
  }

  cargaApellido(value: string) {
    this.Apellido = value != '' ? value : 'Mikasa';
  }

  cargaEdad(value: string) {
    this.Edad = value != '' ? +value : 18;
  }

  cargaEmpresa(value: string) {
    this.Empresa = value != '' ? value : 'Lalo construcciones';
  }

  alternar() {
    this.disableProperty = !this.disableProperty;
  }

  alternarRegistro(value: boolean) {
    this.estadoRegistro = value ? "Registro satisfactorio" : "Error en el registro";
  }

  // eventoRegistro(e: Event) {
  //   this.estadoEventoRegistro = (<HTMLInputElement>e.target).checked ? "Registro satisfactorio" : "Error en el registro";     Esto sería el código para un radiobutton normal
  // }

  eventoRegistro(e: MatSlideToggleChange) {
    this.estadoEventoRegistro = e.checked ? "Registro satisfactorio" : "Error en el registro";
  }

  registrado = false;
  registrarUsuario() {
    this.registrado = !this.registrado;
  }

  nuevoUsuario(nombre: string, apellido: string, edad: number, empresa: string) {
    if (!nombre && !apellido && !isNaN(edad) && !empresa)
      this.e = new Empleado(nombre, apellido, edad, empresa);
    else
      
  }
}