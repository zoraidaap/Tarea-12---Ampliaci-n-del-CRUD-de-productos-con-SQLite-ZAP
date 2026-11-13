import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { SqliteService } from './services/sqlite';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private sqlite: SqliteService) {

     this.sqlite.inicializar()
      .then(() => console.log('SQLite listo'))
      .catch(error => console.error(error));
  }
}
