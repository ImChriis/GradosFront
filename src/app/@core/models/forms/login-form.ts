import { FormControl } from "@angular/forms";

export interface LoginForm{
    usuario: FormControl<string>;
    clave: FormControl<string>;
}