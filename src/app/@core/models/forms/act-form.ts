import { FormControl } from "@angular/forms";

export interface ActPlacesForm{
    CoLugar: FormControl<number | null>;
    TxLugar: FormControl<string | null>;
    Capacidad: FormControl<number | null>;
    MaTipoLugar: FormControl<number | null>;
    Activo: FormControl<number | null>;
    CodUser: FormControl<number | null>;
}