import { EntidadCosmica } from "../@Superclases/entidad-cosmica.model";

export class Empleado extends EntidadCosmica {
  private apellido:string;
  private edad:number;
  private empresa:string;

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

  public constructor(nombre:string, apellido:string, edad:number, empresa:string)
  {
    super();
    this.Nombre = nombre;
    this.apellido = apellido;
    this.edad = edad;
    this.empresa = empresa;
  }
}
