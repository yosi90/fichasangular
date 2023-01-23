export abstract class EntidadCosmica {
  private id:number = 0;
  private nombre:string = "";
  private querys:[] = [];

  public get Id() {
    return this.id;
  }

  public set Id(value: number) {
    if (!isNaN(+value)) //el operador + seguido de una variable la convierte en número. la función isNaN devuelve true si encuentra un not a number (NaN)
      this.id = value;
  }

  public get Nombre() {
    return this.nombre;
  }

  public set Nombre(value: string) {
    this.nombre = value;
  }
}
