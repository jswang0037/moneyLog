import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FireService } from '../fire.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  constructor(
    private fireservice: FireService, 
    private router: Router
  ) { }

  signInGoogle(){
    this.fireservice.signInGoogle(); 
    setTimeout(() => {
      this.checkAuth();       
    }, 3000);
  }
  checkAuth(){    
    const timeOut = 1000; 
    setTimeout(() => {      
      const auth = this.fireservice.auth; 
      const user = auth.currentUser; 
      if(user==null){
        console.log('not sign in yet'); 
      }else{
        console.log('already sign in, redirect to dashboard')
        this.router.navigate(['dashboard']); 
      }
    }, timeOut);
  }

  ngOnInit(): void {
    this.checkAuth(); 
  }

}
