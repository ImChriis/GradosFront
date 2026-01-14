export interface User{
    id: number;
    nombre: string | null;
    apellido: string | null;
    cedula: string | null;
    usuario: string | null;
    clave: string | null;
    maTipoUsr: string | null;
    fechaReg: Date | null;
}