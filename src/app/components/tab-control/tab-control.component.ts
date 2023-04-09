import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-tab-control',
    templateUrl: './tab-control.component.html',
    styleUrls: ['./tab-control.component.sass']
})
export class TabControlComponent implements OnInit {
    usrPerm: number = 0;

    constructor(private usrSvc: UserService) { }

    ngOnInit(): void {
        this.usrPerm = this.usrSvc.Usuario.permisos;
    }
}
