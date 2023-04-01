import { Component, Input } from '@angular/core';
import { Empleado } from 'src/app/@Clases/empleado.model';

@Component({
  selector: 'app-hijo-empleado',
  templateUrl: './hijo-empleado.component.html',
  styleUrls: ['./hijo-empleado.component.sass']
})
export class HijoEmpleadoComponent {
  @Input() e:Empleado = new Empleado("", "", 0, "");
  @Input() i:number = 0;
}
