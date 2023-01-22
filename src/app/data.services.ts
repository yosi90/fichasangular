import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class DataServices {

    constructor(private hhtpClient: HttpClient) {

    }
}