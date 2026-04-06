import { Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-pdf-viewer',
  imports: [],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss'
})
export class PdfViewerComponent implements OnInit{
  private sanitizer = inject(DomSanitizer);
  private config = inject(DynamicDialogConfig);
  pdfUrl!: SafeResourceUrl;

  ngOnInit(){
    const rawUrl = this.config.data.url;
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }
}
