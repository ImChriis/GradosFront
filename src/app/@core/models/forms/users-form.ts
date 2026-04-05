import { FormControl } from "@angular/forms";

export interface UserForm {
    CodUsuario: FormControl<number | null>;
    Cedula: FormControl<string | null>;
    Nombre: FormControl<string | null>;
    Apellido: FormControl<string | null>;
    Usuario: FormControl<string | null>;
    Clave: FormControl<string | null>;
    Clave2: FormControl<string | null>; // Para la validación de coincidencia
    MaTipoUsr: FormControl<string | null>;
    FechaReg: FormControl<Date | string | null>;
}