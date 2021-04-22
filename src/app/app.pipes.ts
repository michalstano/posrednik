import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "amount" })
export class AmountPipe implements PipeTransform {
  transform(maxAmount: number): number[] {
    return [...Array(maxAmount).keys()].map((x) => x + 1);
  }
}

@Pipe({ name: "tableLength" })
export class TableLengthPipe implements PipeTransform {
  transform(length: number): number[] {
    return [...Array(length).keys(), length];
  }
}
