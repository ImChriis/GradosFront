import { FormControl } from "@angular/forms";

export interface SpecialitiesForm {
    CodigoEsp: FormControl<number | null>;
    Titulo: FormControl<string>;
    Especialidad: FormControl<string>;
}