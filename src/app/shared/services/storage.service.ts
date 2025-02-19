import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: AngularFireStorage, private firestore: AngularFirestore) {}

  // Upload da imagem para Firebase Storage
  uploadImage(file: File, movieId: string) {
    const filePath = `movies/${movieId}/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    return new Promise((resolve, reject) => {
      uploadTask.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            // Salva o caminho da imagem no Firestore
            this.firestore.collection('movies').doc(movieId).update({ photo_path: url })
              .then(() => resolve(url))
              .catch(error => reject(error));
          });
        })
      ).subscribe();
    });
  }
}
