import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyAlphanumerics]'
})
export class OnlyAlphanumericsDirective {
  @HostListener('input', ['$event']) onInputChange(event: Event) {
      const input = event.target as HTMLInputElement;
      // Limpia todo lo que NO sea letras de la A-Z ni números 0-9
      input.value = input.value.replace(/[^a-zA-Z0-9]/g, '');
    }
}
