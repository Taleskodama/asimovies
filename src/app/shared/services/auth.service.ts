import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import { UserInterface } from '../interfaces/user-interface';
import { Observable, of, switchMap } from 'rxjs';
import { GoogleAuthProvider } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: AngularFireAuth, private firestore: AngularFirestore, private router: Router) { }

  cadastro(name: string, email: string, password: string, confirmPassword: string){
    if(password !== confirmPassword){
      alert('As senhas não coincidem.');
      return;
    }

    this.auth.createUserWithEmailAndPassword(email, password).then(async userCredential =>{
      const user = userCredential?.user;

      if(user){
        const userData: UserInterface = {
          name: name,
          email: email,
          tipo: 'Usuário'
        }

        await this.salvarDados(user.uid,userData);
        user.sendEmailVerification();
        this.auth.signOut();
      }

  })
  .catch(error=>{
    console.log(error)
  })
}

salvarDados(id: string, user: UserInterface ){
  return this.firestore.collection('users').doc(id).set(user);
}

login(email: string, password: string){
  this.auth.signInWithEmailAndPassword(email, password).then((userCredential)=>{
    if(userCredential.user?.emailVerified){
      console.log('sucesso');
      this.router.navigate(['/home']);
    }
  })
  .catch((error)=>{
    console.log(error)
  })
}

redefinirSenha(email: string){
  this.auth.sendPasswordResetEmail(email).then(()=>{ }).catch((error) =>{
    console.log(error)
  })
}

logout(){
  this.auth.signOut().then(()=>{
    this.router.navigate(['/'])
  }).catch((error) =>{
    console.log(error)
  })
}

getUserData(): Observable<any>{
  return this.auth.authState.pipe(
    switchMap(user => {
      if(user){
        return this.firestore.collection('users').doc(user.uid).valueChanges();
      }else{
        return of(null)
      }
    })
  )
}

// Login/Cadastro via Google
async signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await this.auth.signInWithPopup(provider);

    if (credential.user) {
      // Salvar usuário no Firestore
      this.saveUserData(credential.user);
      this.router.navigate(['/home']); // Redireciona para Home após login
    }
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
  }
}

// Salvar usuário no Firestore
private saveUserData(user: any) {
  const userRef = this.firestore.collection('users').doc(user.uid);
  
  userRef.set(
    {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: new Date()
    },
    { merge: true } // Evita sobrescrever dados existentes
  );
}

// Método de logout
async logoutgoogle() {
  await this.auth.signOut();
  this.router.navigate(['/login']); // Redireciona para a tela de login
}

}
