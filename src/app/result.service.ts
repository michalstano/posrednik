import { Injectable } from "@angular/core";
import { sum, flattenDeep, max, min } from "lodash";

export interface RecordInfo {
  n: number;
  m: number;
  result: number;
  isN?: boolean;
}

export interface Result {
  array: number[][];
  profit: number;
  transportationCosts: number;
  kz: number;
  income: number;
}

@Injectable({
  providedIn: "root",
})
export class ResultService {
  supplierAmount: number;
  customerAmount: number;
  transportationCosts: number[][];
  supply: number[];
  kz: number[];
  demand: number[];
  csp: number[];

  mzj: number[][] = [];
  mw: number[][] = [];

  alfa: number[] = [];
  beta: number[] = [];

  base: number[][] = [];
  maxElement: RecordInfo;

  isFinished: boolean = false;

  calculate(
    supplierAmount: number,
    customerAmount: number,
    transportationCostsInfo: string[][],
    supplyInfo: string[][],
    customerInfo: string[][]
  ): Result {
    this.supplierAmount = supplierAmount;
    this.customerAmount = customerAmount;
    this.transportationCosts = transportationCostsInfo.map((v) =>
      v.map((x) => +x)
    );
    this.supply = supplyInfo.map((v) => +v[0]);
    this.kz = supplyInfo.map((v) => +v[1]);
    this.demand = customerInfo[0].map((v) => +v);
    this.csp = customerInfo[1].map((v) => +v);

    this.createMZJ();
    this.extendDemandAndSupply();
    this.createMW();

    while (!this.isFinished) {
      this.createAlfaAndBeta();
      this.createBase();
      this.findPositiveElement();

      if (this.isFinished) {
        return this.getValue();
      } else {
        this.updateMW();
      }
    }
  }

  private createMZJ(): void {
    for (let i = 0; i < this.supplierAmount + 1; i++) {
      this.mzj[i] = [];
      this.mw[i] = [];
      for (let j = 0; j < this.customerAmount + 1; j++) {
        if (i >= this.supplierAmount || j >= this.customerAmount) {
          this.mzj[i][j] = 0;
        } else {
          this.mzj[i][j] =
            this.csp[j] - (this.kz[i] + this.transportationCosts[i][j]);
        }
        this.mw[i][j] = -1;
      }
    }

    console.log("Step 1): MZJ", { ...this.mzj });
  }

  private extendDemandAndSupply(): void {
    const supplySum = sum(this.supply);
    const demandSum = sum(this.demand);
    this.supply.push(demandSum);
    this.demand.push(supplySum);
  }

  private createMW(): void {
    const findMin = () => {
      let min = this.mzj[0][0];

      for (let i = 0; i < this.mzj.length; i++) {
        for (let j = 0; j < this.mzj[i].length; j++) {
          if (min >= this.mzj[i][j] && this.mw[i][j] == -1) {
            min = this.mzj[i][j];
          }
        }
      }
      return min;
    };

    const findMax = (): RecordInfo => {
      let max = findMin();
      let result: RecordInfo;

      for (let i = 0; i < this.mzj.length; i++) {
        for (let j = 0; j < this.mzj[i].length; j++) {
          if (max <= this.mzj[i][j] && this.mw[i][j] == -1) {
            max = this.mzj[i][j];
            result = {
              m: j,
              n: i,
              result: max,
            };
          }
        }
      }
      return result;
    };

    while (this.mw.some((v) => v.some((x) => x === -1))) {
      const maxResults = findMax();
      const maxN = maxResults.n;
      const maxM = maxResults.m;

      if (this.supply[maxN] >= this.demand[maxM]) {
        for (let i = 0; i < this.mw.length; i++) {
          if (this.mw[i][maxM] == -1) this.mw[i][maxM] = 0;
        }
        this.mw[maxN][maxM] = this.demand[maxM];
        this.supply[maxN] = this.supply[maxN] - this.demand[maxM];
        this.demand[maxM] = 0;
      } else {
        for (let j = 0; j < this.mw[maxN].length; j++) {
          if (this.mw[maxN][j] == -1) this.mw[maxN][j] = 0;
        }
        this.mw[maxN][maxM] = this.supply[maxN];
        this.demand[maxM] = this.demand[maxM] - this.supply[maxN];
        this.supply[maxN] = 0;
      }
    }

    console.log("Step 2): MW", { ...this.mw });
  }

  private createAlfaAndBeta(): void {
    for (let i = 0; i < this.supplierAmount + 1; i++) {
      this.alfa[i] = undefined;
    }

    for (let i = 0; i < this.customerAmount + 1; i++) {
      this.beta[i] = undefined;
    }

    this.alfa[0] = 0;


    while (this.alfa.includes(undefined) || this.beta.includes(undefined)) {
      for (let i = 0; i < this.mw.length; i++) {
        for (let j = 0; j < this.mw[i].length; j++) {
          const isAlfaMissing =
            this.alfa[i] === undefined && this.beta[j] !== undefined;
          const isBetaMissing =
            this.beta[j] === undefined && this.alfa[i] !== undefined;
          if (this.mw[i][j] !== 0) {
            if (isAlfaMissing) {
              this.alfa[i] = this.mzj[i][j] - this.beta[j];
            }
            if (isBetaMissing) {
              this.beta[j] = this.mzj[i][j] - this.alfa[i];
            }
          }
        }
      }
    }

    console.log("Step 3): AiB", { ...this.alfa }, { ...this.beta });
  }

  private createBase(): void {
    for (let i = 0; i <= this.supplierAmount; i++) {
      this.base[i] = [];
      for (let j = 0; j <= this.customerAmount; j++) {
        if (this.mw[i][j] == 0) {
          this.base[i][j] = this.mzj[i][j] - this.alfa[i] - this.beta[j];
        } else {
          this.base[i][j] = 0;
        }
      }
    }
    console.log("Step 4): Base", { ...this.base });
  }

  private findPositiveElement(): void {
    let maxElementValue = max(flattenDeep(this.base));
    for (let i = 0; i <= this.supplierAmount; i++) {
      for (let j = 0; j <= this.customerAmount; j++) {
        if (this.base[i][j] === maxElementValue) {
          this.maxElement = {
            m: j,
            n: i,
            result: maxElementValue,
            isN: false,
          };
        }
      }
    }

    if (maxElementValue <= 0) {
      this.isFinished = true;
    }
  }

  private updateMW(): void {
    let result: RecordInfo[] = [];
    for (let i = 0; i <= this.supplierAmount; i++) {
      if (this.base[i][this.maxElement.m] === 0) {
        for (let j = 0; j <= this.customerAmount; j++) {
          if (this.base[i][j] === 0 && this.base[this.maxElement.n][j] === 0) {
            result = [
              { m: j, n: i, result: this.base[i][j], isN: false },
              this.maxElement,
              {
                m: j,
                n: this.maxElement.n,
                result: this.base[this.maxElement.n][j],
                isN: true,
              },
              {
                m: this.maxElement.m,
                n: i,
                result: this.base[i][this.maxElement.m],
                isN: true,
              },
            ];
          }
        }
      }
    }
    const minValue = min(
      result.filter((r) => r.isN).map((r) => this.mw[r.n][r.m])
    );

    result.forEach((r) =>
      r.isN
        ? (this.mw[r.n][r.m] = this.mw[r.n][r.m] - minValue)
        : (this.mw[r.n][r.m] = this.mw[r.n][r.m] + minValue)
    );

    console.log("Step 5): Update MW", { ...this.mw });
  }

  private getValue(): Result {
    const array = this.mw;
    let profit: number = 0;
    let transportationCosts: number = 0;
    let kz: number = 0;
    let income: number = 0;

    for (let i = 0; i < this.supplierAmount; i++) {
      for (let j = 0; j < this.customerAmount; j++) {
        profit = profit + this.mw[i][j] * this.mzj[i][j];
        transportationCosts =
          transportationCosts + this.mw[i][j] * this.transportationCosts[i][j];
        kz = kz + this.mw[i][j] * this.kz[i];
        income = income + this.mw[i][j] * this.csp[j];
      }
    }

    this.reset();
    return { array, profit, transportationCosts, income, kz };
  }

  private reset(): void {
    this.supplierAmount = 0;
    this.customerAmount = 0;
    this.transportationCosts = [];
    this.supply = [];
    this.kz = [];
    this.demand = [];
    this.csp = [];

    this.mzj = [];
    this.mw = [];

    this.alfa = [];
    this.beta = [];

    this.base = [];
    this.maxElement = undefined;

    this.isFinished = false;
  }
}
