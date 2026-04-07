import { FormControl } from "@angular/forms";

export interface BankForm {
    id: FormControl<number | null>;
    Bancos: FormControl<string | null>;
    Codigo: FormControl<string | null>;
    Status: FormControl<number | null>;
}