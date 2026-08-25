import { FormControl } from "@angular/forms";

export interface BankForm {
    id: FormControl<number | null>;
    bancos: FormControl<string | null>;
    codigo: FormControl<string | null>;
    status: FormControl<number | null>;
}