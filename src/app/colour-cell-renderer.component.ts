import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

// simple cell renderer returns dummy buttons. in a real application, a component would probably
// be used with operations tied to the buttons. in this example, the cell renderer is just for
// display purposes.
@Component({
  selector: 'simple-component',
  template: `
    <span
      [style.borderLeft]="'10px solid ' + params.value"
      [style.paddingLeft]="'5px'"
      >{{ params.value }}</span
    >
  `,
})
export class ColourCellRenderer implements ICellRendererAngularComp {
  public params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh() {
    return false;
  }
}