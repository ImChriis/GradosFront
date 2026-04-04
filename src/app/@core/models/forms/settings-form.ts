import { FormControl } from "@angular/forms";

export interface SettingsForm {
    Id: FormControl<string | null>;
    CoSucursal: FormControl<string | null>;
    NbSucursal: FormControl<string | null>;
    Producto: FormControl<string | null>;
    Nombre: FormControl<string | null>;
    Rif: FormControl<string | null>;
    Direccion: FormControl<string | null>;
    Telefono: FormControl<string | null>;
    Fax: FormControl<string | null>;
    feregistro: FormControl<Date | string | null>;
    txclaveadm: FormControl<string | null>;
    NoRecibo: FormControl<number | null>;
    NoContrato: FormControl<number | null>;
    NoActo: FormControl<number | null>;
    NoCierre: FormControl<number | null>;
    CaDiasFab: FormControl<number | null>;
    CaDiasEngaste: FormControl<number | null>;
    MaFormRec: FormControl<number | null>;
    PcOro18: FormControl<string | null>;
    PcOro14: FormControl<string | null>;
    PcOro10: FormControl<string | null>;
    MnMerma: FormControl<string | null>;
    MnCostOro: FormControl<string | null>;
    Impuesto: FormControl<string | null>;
    MnCostoMano: FormControl<string | null>;
    UbicacionLogo: FormControl<string | null>;
    UbicacionRpt: FormControl<string | null>;
    TxMensaje1: FormControl<string | null>;
    TxMensaje2: FormControl<string | null>;
    TxMensaje3: FormControl<string | null>;
    GeneraNoRecibo: FormControl<boolean | null>;
    GeneraNoContrato: FormControl<boolean | null>;
    GeneraNoActo: FormControl<boolean | null>;
    GeneraNoCierre: FormControl<boolean | null>;
}