import { Injectable } from '@angular/core';
import { deleteDoc } from '@angular/fire/firestore';
import { signOut, getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth';
import { getFirestore, getDocs, query, collection, where, updateDoc, doc, addDoc } from '@firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FireService {

  constructor() { }

  auth = getAuth(); 
  db = getFirestore();  

  signInGoogle(){
    const provider = new GoogleAuthProvider(); 
    return signInWithPopup(this.auth, provider); 
  }

  signOut(){
    signOut(this.auth).then(() => {
      console.log('Sign-out successful.'); 
    }).catch((error) => {
      console.log(error); 
    }); 
  }

  async readDataByUid(table: string, uid: string|null){
    try{
      console.log('query for uid', uid, ' in table ', table)
      const q = query(collection(this.db, table), where("uid", "==", uid))
      const data = await getDocs(q); 
      return data
    }catch (e) {
      console.error("readData error: ", e);
      return []
    }
  }

  async updateData(table: string, id: string, data: { [x: string]: any; }){
    try{
      const docRef = doc(this.db, table, id); 
      await updateDoc(docRef, data); 
      return 'updateData complete'; 
    }catch (e) {
      console.error("updateData error: ", e);
      return []
    }
  }  

  async addData(table: string, data: { [x: string]: any; }){
    try{
      await addDoc(collection(this.db, table), data); 
      return 'addData complete'; 
    }catch (e) {
      console.error("addData error: ", e);
      return []
    }
  }

  async deleteData(table: string, id: string){
    try{
      const docRef = doc(this.db, table, id); 
      await deleteDoc(docRef); 
      return 'deleteData complete'; 
    }catch (e) {
      console.error("deleteData error: ", e);
      return []
    }
  }

}