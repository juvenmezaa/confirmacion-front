import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import * as Papa from 'papaparse';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import {CsvService} from './Services/csv.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet,CommonModule,FormsModule, ReactiveFormsModule, HttpClientModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    providers: [CsvService]
})
export class AppComponent implements OnInit {
    days: number = 0;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    numberFromUrl: number | null = null;
    selectedNumber: number | null = null;
    numbers: number[] = [];
    datosForm!: FormGroup;
    nombre!: string;

    csvData: any[] = [];
    hideCel: boolean = true;

    private targetDate: Date = new Date('2024-10-11T18:00:00');

    constructor(private ngZone: NgZone, 
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private fb: FormBuilder,
        private csvService: CsvService,
        private http: HttpClient
        ){

        this.datosForm = this.fb.group({
            pases: [null, [Validators.required]],
            celular: [null, [Validators.required]]
        });
    }

    ngOnInit() {
        this.cargarCsv();
        this.updateCountdown();
        this.ngZone.runOutsideAngular(()=>{
            setInterval(() => {
                this.ngZone.run(() => {
                    this.updateCountdown();
                });
            }, 1000);
        });
        
        this.route.queryParams.subscribe(params => {
            this.numberFromUrl = +params['celular'] || null;
            if(this.numberFromUrl != null) {
                this.datosForm.get("celular")?.setValue(this.numberFromUrl);
                let datos = this.buscarNombre(this.numberFromUrl);
                this.cargarNombre(datos);
            } else {
                this.hideCel = false;
            }
        });
    }

    cargarNombre(datos: any) {
        if(datos.nombre != null) {
            this.nombre = datos.nombre;
            this.numbers = Array.from({length: (datos.pases-0+1)}, (_, index) => index);
            this.hideCel = true;
            if(datos.confirmados >= 0) {
                Swal.fire({
                  title: "Info",
                  text: "Ya se encuentra una confirmación, esta se actualizara",
                  icon: "info"
                });
            }
        } else {
            this.hideCel = false;
        } 
    }

    cargarCsv() {
        this.http.get<any[]>('https://confirmacion-back.onrender.com/api/consultar-csv')
          .subscribe(data => {
            this.csvData = data;
          }, error => {
            console.error('Error al consultar el archivo CSV', error);
          });
    }

    buscarNombre(numero: number) {
    if (this.csvData.length > 0) {
        let persona = this.csvData.find(row => row.celular === (""+numero));
        if (persona) {
            return {
                nombre: persona.nombre,
                pases: persona.pases,
                confirmados: persona.confirmados
            };
        } else {
            return {nombre : null};
        }
    }
    return {nombre : null};
  }

  buscarCelular() {
    let datos = this.buscarNombre(this.datosForm.get("celular")?.value);
    if(datos.nombre == null) {
        Swal.fire({
          title: "Error",
          text: "No se encontró nadie con ese número",
          icon: "error"
        });
    } else {
        this.cargarNombre(datos);
    }
  }


    updateCountdown() {
        const currentDate = new Date().getTime();
        const distance = this.targetDate.getTime() - currentDate;

        this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
        this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        this.seconds = Math.floor((distance % (1000 * 60)) / 1000);        
    }

    onSubmit() {
        this.modificarCSV(this.datosForm.get("celular")?.value, this.datosForm.get("pases")?.value).subscribe(data => {
            Swal.fire({
              title: "Confirmación exitosa",
              text: "Gracias por confirmar",
              icon: "success"
            }).then(() => {
                window.location.href = 'https://juvenmezaa3.wixsite.com/my-site-1';
            });
          }, error => {
            Swal.fire({
              title: "Error",
              text: "Ocurrio un error, intente de nuevo",
              icon: "error"
            });
          });;
    }

    modificarCSV(buscarPor: string, nuevoValor: string) {
        const body = { buscarPor, nuevoValor };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        return this.http.post<any>('https://confirmacion-back.onrender.com/api/modificar-csv', body, { headers });
    }
}