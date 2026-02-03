import { FormControl } from "@angular/forms";

export interface ClientForm{
    id: FormControl<number | null>;
    nucedula: FormControl<string | null>;
	txnombre: FormControl<string | null>;
    txdireccion: FormControl<string | null>;
    txtelefono: FormControl<string | null>;
    txcelular: FormControl<string | null>;
    txemail: FormControl<string | null>;
    feingreso: FormControl<string | null>;
    codUser: FormControl<string | null>;
}