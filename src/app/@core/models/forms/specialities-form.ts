import { FormControl } from "@angular/forms";

export interface SpecilitiesForm {
    id: FormControl<number | null>;
    Titulo: FormControl<string>;
    Descripcion: FormControl<string>;
}