import { Component, OnInit } from '@angular/core'
import { FireService } from '../fire.service';
import { Router } from '@angular/router';
import { ColourCellRenderer } from '../colour-cell-renderer.component';
import { ColDef, ValueGetterParams, ICellEditorComp, ICellEditorParams} from 'ag-grid-community';
import * as Highcharts from 'highcharts'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(
    private fireservice: FireService, 
    private router: Router
    ) { }
  
  signOut(){
    this.fireservice.signOut(); 
    this.checkAuth(); 
  }

  checkAuth(){    
    const timeOut = 1000; 
    setTimeout(() => {      
      const auth = this.fireservice.auth; 
      const user = auth.currentUser; 
      if(user==null){
        console.log('not sign in yet, redirect to welcome'); 
        this.router.navigate(['welcome']); 
      }else{
        console.log('already sign in, set displayName')
        this.displayName = user.displayName; 
        this.uid = user.uid;         
        this.readData("initial"); 
        this.readData("in_out"); 
      }
    }, timeOut);

  }

  deleteSelectedRow(){
    const dataSelected = this.gridApi.getSelectedRows(); 
    for(var i=0; i<dataSelected.length; i++){
      const data = dataSelected[i]; 
      this.deleteData('in_out', data.id); 
    }
  }

  async readData(table: string){
    const data = await this.fireservice.readDataByUid(table, this.uid); 
    let tempData: object[] = []; 
    data.forEach(element => {
      const tempDict: {[x:string]: any} = {};

      tempDict['id'] = element.id; 
      for(var key in element.data()){
        tempDict[key] = element.data()[key]; 
      }

      tempData.push(tempDict)
    })

    if(table==="initial"){
      if(tempData.length===0){
        tempData = [
          {
            'start_date': new Date().toISOString().substring(0, 10), 
            'start_saving': 0, 
            'uid': this.uid
          }
        ]; 
      }
      this.dataInit = tempData; 
    }else if(table==="in_out"){
      this.dataInOut = tempData; 
    }
    this.setPlotData(); 
  }

  setPlotData(){
    const start_date = this.dataInit[0]['start_date']; 
    var start_saving = Number(this.dataInit[0]['start_saving']); 
    const nowTimestamp = new Date(start_date).getTime(); 
    var dataPlot = [{
      x: nowTimestamp, 
      y: start_saving, 
      desc: '?????????', 
      value: start_saving
    }]; 

    for(var i=0; i<=365; i++){
      const timestamp = nowTimestamp + 86400*i*1000; 
      const year = new Date(timestamp).getFullYear(); 
      const month = new Date(timestamp).getMonth() + 1; //0~11 => 1~12
      const date = new Date(timestamp).getDate(); //1~31
      const day = new Date(timestamp).getDay() + 1;  //0~6 => 1~7

      // check rules
      for(var j=0; j<this.dataInOut.length; j++){
        var element = this.dataInOut[j]; 
        if(
          timestamp >= new Date(element['start_date']).getTime()
          &&
          timestamp <= new Date(element['end_data']).getTime()
        ){
          if(
            (element['frequency_type']==='day')
            ||(element['frequency_type']==='week'&&Number(element['date']) === day)
            ||(element['frequency_type']==='month'&&Number(element['date']) === date)
            ||(element['frequency_type']==='year'&&Number(element['date']) === month&&date===1)
          ){
            var value = Number(element['value']); 
            if(element['type']==='out'){
              value *= -1; 
            }
            start_saving += value
            dataPlot.push(
              {
                x: timestamp, 
                y: start_saving, 
                desc: element['desc'], 
                value: value
              }
            )
          }
        }
      }
    }


    if(this.chartOptions.series!=undefined){

      this.chartOptions.series[0] = {
        data: dataPlot, 
        type: 'line'
      }
      this.updateFlag = true; 
    }

  }

  addData(table: string){
    this.fireservice.addData(table, {
      'uid': this.uid
    }); 
    this.readData(table); 
  }

  deleteData(table: string, id: string){
    this.fireservice.deleteData(table, id); 
    this.readData(table); 
  }

  toDescription(params: ValueGetterParams) {
    let tempStr = '???'; 

    //tempStr += params.data.frequency; 
    //tempStr += '???'
    
    switch(params.data.frequency_type){
      case 'day':
        tempStr += '???'; 
        break;         
      case 'week':
        tempStr += '???'; 
        break; 
      case 'month':
        tempStr += '???'; 
        break; 
      case 'year':
        tempStr += '???'; 
        break; 

      default: 
        break; 
            
    }

    tempStr += '???'; 

    switch(params.data.frequency_type){
      case 'day':
        tempStr += '??????'
        break
      case 'week':
        tempStr += '??????'; 
        switch(params.data.date){
          case '0':
            tempStr += '???'; 
            break; 
          case '1':
            tempStr += '???'; 
            break; 
          case '2':
            tempStr += '???'; 
            break; 
          case '3':
            tempStr += '???'; 
            break; 
          case '4':
            tempStr += '???'; 
            break; 
          case '5':
            tempStr += '???'; 
            break; 
          case '6':
            tempStr += '???'; 
            break; 
          default:
            break; 
        }
        break; 

      case 'month':
        tempStr += params.data.date; 
        tempStr += '???'; 
        break; 

      case 'year':
        tempStr += params.data.date; 
        tempStr += '???'; 
        break; 

      default: 
        break;        
    }

    switch(params.data.type){
      case 'in':
        tempStr += '??????'; 
        break; 

      case 'out':
        tempStr += '??????'; 
        break; 

      default: 
        break;             
    }

    tempStr += params.data.value; 
    tempStr += '???'; 

    return tempStr
  }
  // Initial Change
  onCellValueChange(table: string, event: any){
    const data = event.data; 
    const id = data.id; 
    const newData: {[x: string]: any} = {}
    for(var key in data){
      if(key!='id'){
        newData[key] = data[key]; 
      }
    }
    this.fireservice.updateData(
      table, 
      id, 
      newData
    )
    
    this.setPlotData(); 
  }

  onInitGridReady(params: any){
    this.gridApi = params.api; 
    this.gridColumnApi = params.columnApi;
  }

  autoSizeAll(skipHeader: boolean) {
    const allColumnIds: string[] = [];
    const columns = this.gridColumnApi.getColumns(); 

    for(var i=0; i<columns.length; i++){
      const column = columns[i]; 
      allColumnIds.push(column.getId());
    }
    this.gridColumnApi.autoSizeColumns(allColumnIds, skipHeader);
  }

  setLanguage(language: string){
    this.language = language; 

    this.languagePack = this.languageFullPack[language]; 
  }

  displayName: string|null = '';   
  uid: string|null = ''; 
  dataInit!: {[x: string]: any}[]; 
  dataInOut!: {[x: string]: any}[]; 
  gridApi!: any; 
  gridColumnApi!: any; 

  language: string = 'zh_tw'; 
  languageFullPack: {[x: string]: {[x: string]: string}} = {
    'en': {
      signout: 'Sign Out', 
      welcome: 'Welcome! ', 
      setting: 'Setting', 
      initial: 'Initial Value', 
      p1: 'Use ', 
      mark1: 'double clicks ', 
      p2: 'to change the value. ', 
      inAndOut: 'In and Out', 
      addRow: 'Add Row', 
      autoSize: 'Auto Size', 
      deleteRow: 'Delete Selected Row', 
      cashFlow: 'Cash Flow'
    }, 
    'zh_tw': {
      signout: '??????', 
      welcome: '?????????', 
      setting: '??????', 
      initial: '?????????', 
      p1: '??????', 
      mark1: '??????', 
      p2: '??????????????????', 
      inAndOut: '???????????????', 
      addRow: '??????????????????', 
      autoSize: '??????????????????', 
      deleteRow: '?????????????????????', 
      cashFlow: '?????????'
    }
  }; 
  languagePack = this.languageFullPack['zh_tw']; 

  // Initial
  columnDefs: ColDef[] = [
    { 
      field: 'start_saving', 
      headerName: '????????????'
    },
    { 
      field: 'start_date', 
      headerName: '????????????',
      cellEditor: DatePicker
    }
  ];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    editable: true
  };
  colorList = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Black', 'Grey']; 
  frequencyList = ['day', 'week', 'month', 'year']; 

  // In and Out
  columnDefs2: ColDef[] = [
    { 
      field: 'start_date', 
      headerName: '????????????', 
      cellEditor: DatePicker
    },
    { 
      field: 'end_data', 
      headerName: '????????????', 
      cellEditor: DatePicker
    }, 
    {
      field: 'type', 
      headerName: '??????', 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: ['in', 'out']
      }
    }, 
    { 
      field: 'frequency_type', 
      headerName: '????????????', 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: this.frequencyList
      }, 
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => this.frequencyList.indexOf(valueB) - this.frequencyList.indexOf(valueA)
    }, 
    { 
      field: 'frequency', 
      headerName: '??????', 
      hide: true
    }, 
    { 
      field: 'date', 
      headerName: '?????????', 
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => Number(valueB) - Number(valueA)
    }, 
    { 
      field: 'value', 
      headerName: '??????', 
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => Number(valueB) - Number(valueA)
    }, 
    { 
      field: 'desc', 
      headerName: '??????'
    }, 
    { 
      field: 'color', 
      headerName: '??????', 
      cellRenderer: ColourCellRenderer, 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: this.colorList
      }, 
      comparator: (valueA, valueB, nodeA, nodeB, isDescending) => this.colorList.indexOf(valueB) - this.colorList.indexOf(valueA)
    }, 
    {       
      headerName: '??????', 
      valueGetter: this.toDescription, 
      editable: false
    }
  ];
  defaultColDef2: ColDef = {
    sortable: true,
    filter: true,
    editable: true
  };
  
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false; 
  chartOptions: Highcharts.Options = {
    chart: {
      zooming: {
        type: 'x'
      }
    }, 
    title: {
      text: '?????????'
    }, 
    series: [{
      data: [],
      type: 'line', 
      name: '??????', 
      findNearestPointBy: 'xy'
    }], 
    tooltip: {
      dateTimeLabelFormats: {
        day: '%Y-%m-%d', 
        month: '%Y-%m',
        year: '%Y'
      }, 
      pointFormat: '??????: {point.y}<br>??????: {point.value}<br>??????: {point.desc}'
    }, 
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: { // don't display the year
          day: '%Y-%m-%d', 
          month: '%Y-%m',
          year: '%Y'
      },
      title: {
          text: 'Time'
      }
    },
  };

  ngOnInit(): void {
    this.checkAuth(); 
  }

}
class DatePicker implements ICellEditorComp {
  eInput!: HTMLInputElement;

  // gets called once before the renderer is used
  init(params: ICellEditorParams) {
    // create the cell
    this.eInput = document.createElement('input');
    this.eInput.type = 'date'; 
    this.eInput.value = params.value;
    this.eInput.classList.add('ag-input');
    this.eInput.style.height = '100%';
  }

  // gets called once when grid ready to insert the element
  getGui() {
    return this.eInput;
  }

  // focus and select can be done after the gui is attached
  afterGuiAttached() {
    this.eInput.focus();
    this.eInput.select();
  }

  // returns the new value after editing
  getValue() {
    return this.eInput.value;
  }

  // any cleanup we need to be done here
  destroy() {
    // but this example is simple, no cleanup, we could
    // even leave this method out as it's optional
  }

  // if true, then this editor will appear in a popup
  isPopup() {
    // and we could leave this method out also, false is the default
    return false;
  }
}