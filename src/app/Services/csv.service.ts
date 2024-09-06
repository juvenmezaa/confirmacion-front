import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class CsvService {
  constructor(private http: HttpClient) {}

  leerCsv(ruta: string): Observable<any[]> {
    return new Observable((observer) => {
      this.http.get(ruta, { responseType: 'text' }).subscribe({
        next: (data) => {
          Papa.parse(data, {
            complete: (result) => {
              observer.next(result.data);
              observer.complete();
            },
            header: false
          });
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}