import { FormControl } from "@angular/forms";

export interface PaymentMethodForm{
    idMetodoPago: FormControl<number | null>;
    nombreMetodoPago: FormControl<string | null>;
    status: FormControl<number | null>;
}