import { Component, OnInit } from '@angular/core'
import { FireService } from '../fire.service';
import { Router } from '@angular/router';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import * as Highcharts from 'highcharts'; 
import { time } from 'console';

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
    const tempData: object[] = []; 
    data.forEach(element => {
      const tempDict: {[x:string]: any} = {};

      tempDict['id'] = element.id; 
      for(var key in element.data()){
        tempDict[key] = element.data()[key]; 
      }

      tempData.push(tempDict)
    })

    if(table==="initial"){
      this.dataInit = tempData; 
    }else if(table==="in_out"){
      this.dataInOut = tempData; 
      this.setPlotData(); 
    }
  }

  setPlotData(){
    const start_date = this.dataInit[0]['start_date']; 
    var start_saving = Number(this.dataInit[0]['start_saving']); 
    const nowTimestamp = new Date(start_date).getTime(); 
    var dataPlot = [[nowTimestamp, start_saving]]; 

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
          if(Number(element['date']) === date){
            var value = Number(element['value']); 
            if(element['type']==='out'){
              value *= -1; 
            }
            start_saving += value
            dataPlot.push([timestamp, start_saving])
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
    let tempStr = '每'; 

    tempStr += params.data.frequency; 
    tempStr += '個'
    
    switch(params.data.frequency_type){
      case 'week':
        tempStr += '週'; 
        break; 

      case 'month':
        tempStr += '月'; 
        break; 

      case 'year':
        tempStr += '年'; 
        break; 

      default: 
        break; 
            
    }

    tempStr += '的'; 

    switch(params.data.frequency_type){
      case 'week':
        tempStr += '星期'; 
        switch(params.data.date){
          case '0':
            tempStr += '日'; 
            break; 
          case '1':
            tempStr += '一'; 
            break; 
          case '2':
            tempStr += '二'; 
            break; 
          case '3':
            tempStr += '三'; 
            break; 
          case '4':
            tempStr += '四'; 
            break; 
          case '5':
            tempStr += '五'; 
            break; 
          case '6':
            tempStr += '六'; 
            break; 
          default:
            break; 
        }
        break; 

      case 'month':
        tempStr += params.data.date; 
        tempStr += '號'; 
        break; 

      case 'year':
        tempStr += params.data.date; 
        tempStr += '月'; 
        break; 

      default: 
        break;        
    }

    switch(params.data.type){
      case 'in':
        tempStr += '收入'; 
        break; 

      case 'out':
        tempStr += '支出'; 
        break; 

      default: 
        break;             
    }

    tempStr += params.data.value; 
    tempStr += '元'; 

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

  displayName: string|null = '';   
  uid: string|null = ''; 
  dataInit!: {[x: string]: any}[]; 
  dataInOut!: {[x: string]: any}[]; 
  gridApi!: any; 
  gridColumnApi!: any; 

  // Initial
  columnDefs: ColDef[] = [
    { 
      field: 'start_saving', 
      headerName: '初始金額'
    },
    { 
      field: 'start_date', 
      headerName: '初始日期 (yyyy-mm-dd)'
    }
  ];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    editable: true
  };

  // In and Out
  columnDefs2: ColDef[] = [
    { 
      field: 'start_date', 
      headerName: '開始日期'
    },
    { 
      field: 'end_data', 
      headerName: '結束日期'
    }, 
    {
      field: 'type', 
      headerName: '類別', 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: ['in', 'out']
      }
    }, 
    { 
      field: 'frequency_type', 
      headerName: '頻率類別', 
      cellEditor: 'agSelectCellEditor', 
      cellEditorParams: {
        values: ['week', 'month', 'year']
      }
    }, 
    { 
      field: 'frequency', 
      headerName: '頻率'
    }, 
    { 
      field: 'date', 
      headerName: '發生日'
    }, 
    { 
      field: 'value', 
      headerName: '金額'
    },  
    { 
      field: 'desc', 
      headerName: '備註'
    }, 
    {       
      headerName: '敘述', 
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
    series: [{
      data: [],
      type: 'line'
    }], 
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
