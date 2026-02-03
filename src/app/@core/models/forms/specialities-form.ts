import { FormControl } from "@angular/forms";

export interface SpecilitiesForm {
    CodigoEsp: FormControl<number | null>;
    Titulo: FormControl<string>;
    Descripcion: FormControl<string>;
}