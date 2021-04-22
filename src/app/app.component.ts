import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { Validators } from "@angular/forms";
import { FormArray, FormControl, FormGroup } from "@ngneat/reactive-forms";
import { combineLatest } from "rxjs";
import { startWith } from "rxjs/operators";
import { Result, ResultService } from "./result.service";

@Component({
  selector: "app-root",
  template: ` <div class="left">
      <div class="input-form">
        <mat-form-field appearance="fill">
          <mat-label>Ilość dostawców</mat-label>
          <mat-select [formControl]="supplierAmountCtrl">
            <mat-option
              *ngFor="let value of config.maxAmount | amount"
              [value]="value"
              >{{ value }}</mat-option
            >
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="fill">
          <mat-label>Ilość odbiorców</mat-label>
          <mat-select [formControl]="customerAmountCtrl">
            <mat-option
              *ngFor="let value of config.maxAmount | amount"
              [value]="value"
              >{{ value }}</mat-option
            >
          </mat-select>
        </mat-form-field>
      </div>
      <div class="tables-container">
        <h4>1) Popyt i ceny sprzedaży:</h4>
        <table>
          <tr *ngFor="let infoIndex of [0, 1, 2]">
            <th
              *ngFor="
                let cusIndex of customerInfoCtrl.controls[
                  infoIndex ? infoIndex - 1 : infoIndex
                ]?.controls.length | tableLength
              "
              [ngClass]="{
                corner: infoIndex === 0 && cusIndex === 0,
                customer: infoIndex === 0 && !!cusIndex,
                supplier: !!infoIndex && cusIndex === 0
              }"
            >
              <ng-container *ngIf="infoIndex === 0 && !!cusIndex"
                >O{{ cusIndex }}</ng-container
              >
              <ng-container *ngIf="infoIndex === 1 && cusIndex === 0"
                >Popyt</ng-container
              >
              <ng-container *ngIf="infoIndex === 2 && cusIndex === 0"
                >C. sp.</ng-container
              >
              <input
                *ngIf="!!infoIndex && !!cusIndex"
                maxlength="3"
                (keypress)="($event.charCode >= 48 && $event.charCode < 58)"
                [formControl]="
                  $any(customerInfoCtrl.controls[infoIndex - 1])?.controls[
                    cusIndex - 1
                  ]
                "
              />
            </th>
          </tr>
        </table>

        <h4>2) Podaż i jednostkowe koszty zakupy:</h4>
        <table>
          <tr>
            <th class="corner"></th>
            <th class="customer">Podaż</th>
            <th class="customer">JKZ</th>
          </tr>
          <tr
            *ngFor="let supIndex of supplierInfoCtrl.controls?.length | amount"
          >
            <th
              *ngFor="let infoIndex of [0, 1, 2]"
              [ngClass]="{
                corner: supIndex === 0 && infoIndex === 0,
                customer: supIndex === 0 && !!infoIndex,
                supplier: !!supIndex && infoIndex === 0
              }"
            >
              <ng-container *ngIf="!!supIndex && infoIndex === 0"
                >D{{ supIndex }}</ng-container
              >
              <input
                *ngIf="!!supIndex && !!infoIndex"
                maxlength="3"
                (keypress)="($event.charCode >= 48 && $event.charCode < 58)"
                [formControl]="
                  $any(supplierInfoCtrl.controls[supIndex - 1])?.controls[
                    infoIndex - 1
                  ]
                "
              />
            </th>
          </tr>
        </table>

        <h4>3) Jednostkowe koszty transportu:</h4>
        <table>
          <tr
            *ngFor="
              let supIndex of transportationCostsCtrl.controls?.length
                | tableLength
            "
          >
            <th
              *ngFor="
                let cusIndex of transportationCostsCtrl.controls[
                  supIndex ? supIndex - 1 : supIndex
                ]?.controls.length | tableLength
              "
              [ngClass]="{
                corner: supIndex === 0 && cusIndex === 0,
                customer: supIndex === 0 && !!cusIndex,
                supplier: !!supIndex && cusIndex === 0
              }"
            >
              <ng-container *ngIf="supIndex === 0 && !!cusIndex"
                >O{{ cusIndex }}</ng-container
              >
              <ng-container *ngIf="!!supIndex && cusIndex === 0"
                >D{{ supIndex }}</ng-container
              >
              <input
                *ngIf="!!supIndex && !!cusIndex"
                maxlength="3"
                (keypress)="($event.charCode >= 48 && $event.charCode < 58)"
                [formControl]="
                  $any(transportationCostsCtrl.controls[supIndex - 1])
                    ?.controls[cusIndex - 1]
                "
              />
            </th>
          </tr>
        </table>
      </div>
    </div>
    <div class="button-container">
      <button
        mat-fab
        class="submit"
        [class.disabled]="form.invalid"
        [disabled]="form.invalid"
        (click)="calculate()"
      >
        <mat-icon>east</mat-icon>
      </button>
      <button mat-icon-button class="clear" color="primary" (click)="clear()">
        <mat-icon>highlight_off</mat-icon>
      </button>
    </div>
    <div class="right">
      <ng-container *ngIf="result">
        <table>
          <tr>
            <th
              *ngFor="
                let res of result.array.length | tableLength;
                index as index
              "
              [ngClass]="{
                corner: !index,
                customer: !!index
              }"
            >
              <ng-container *ngIf="!!index"> O{{ index }} </ng-container>
            </th>
          </tr>
          <tr
            *ngFor="
              let supplier of result?.array | slice: 0:result?.array.length - 1;
              index as supIndex
            "
          >
            <th class="supplier">D{{ supIndex + 1 }}</th>
            <th *ngFor="let result of supplier | slice: 0:supplier.length - 1; index as cusIndex">
              <ng-container>
                {{ result }}
              </ng-container>
            </th>
          </tr>
        </table>

        <mat-label>Zysk:</mat-label> {{ result.profit }}
        <mat-label>Koszt transportu:</mat-label>
        {{ result.transportationCosts }} <mat-label>Koszt zakupu:</mat-label>
        {{ result.kz }} <mat-label>Przychód:</mat-label> {{ result.income }}
      </ng-container>
    </div>`,
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  readonly config = {
    maxAmount: 5,
  };

  supplierAmountCtrl = new FormControl(1, {
    validators: [Validators.required],
  });
  customerAmountCtrl = new FormControl(1, {
    validators: [Validators.required],
  });
  supplierInfoCtrl = new FormArray([]);
  customerInfoCtrl = new FormArray([]);
  transportationCostsCtrl = new FormArray([new FormArray([])]);

  result: Result = undefined;

  form = new FormGroup({
    supplierAmount: this.supplierAmountCtrl,
    customerAmount: this.customerAmountCtrl,
    supplierInfo: this.supplierInfoCtrl,
    customerInfo: this.customerInfoCtrl,
    transportationCosts: this.transportationCostsCtrl,
  });

  constructor(public resultService: ResultService) {}

  ngOnInit(): void {
    this.setTransportationCosts();
    this.setSupplierInfo();
    this.setCustomerInfo();
  }

  calculate(): void {
    const res = this.resultService.calculate(
      this.supplierAmountCtrl.value,
      this.customerAmountCtrl.value,
      this.transportationCostsCtrl.value,
      this.supplierInfoCtrl.value,
      this.customerInfoCtrl.value
    );
    this.result = res;
  }

  clear(): void {
    this.result = undefined;
  }

  private setTransportationCosts(): void {
    combineLatest([
      this.supplierAmountCtrl.value$,
      this.customerAmountCtrl.value$,
    ])
      .pipe(startWith([1, 1]))
      .subscribe(([supAmount, cusAmount]: [number, number]) => {
        this.transportationCostsCtrl.clear();
        [...Array(supAmount)].forEach(() =>
          this.transportationCostsCtrl.push(
            new FormArray(
              [...Array(cusAmount)].map(
                () =>
                  new FormControl(undefined, {
                    validators: [Validators.required],
                  })
              )
            )
          )
        );
      });
  }

  private setSupplierInfo(): void {
    this.supplierAmountCtrl.value$.subscribe((amount) => {
      this.supplierInfoCtrl.clear();
      [...Array(amount)].map(() =>
        this.supplierInfoCtrl.push(
          new FormArray(
            [...Array(2)].map(
              () =>
                new FormControl(undefined, {
                  validators: [Validators.required],
                })
            )
          )
        )
      );
    });
  }

  private setCustomerInfo(): void {
    this.customerAmountCtrl.value$.subscribe((amount) => {
      this.customerInfoCtrl.clear();
      [...Array(2)].map(() =>
        this.customerInfoCtrl.push(
          new FormArray(
            [...Array(amount)].map(
              () =>
                new FormControl(undefined, {
                  validators: [Validators.required],
                })
            )
          )
        )
      );
    });
  }
}
