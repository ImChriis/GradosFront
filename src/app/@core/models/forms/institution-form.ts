import { FormControl } from "@angular/forms";

export interface InstitutionForm{
    CodigoInst: FormControl<number | null>;
    siglas: FormControl<string>;
    nbinstitucion: FormControl<string>;
    tpinstitucion: FormControl<string>;
}