import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  AlertController,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonCardHeader,
  IonText,
  IonListHeader,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import {
  SqliteService,
  Producto
} from '../services/sqlite';

import { addIcons } from 'ionicons';

import {
  add,
  createOutline,
  trashOutline,
  cubeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonText,
    IonListHeader,
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})
export class ProductosPage implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = []; // Arreglo para la vista ordenada
  criterioOrden: string = 'asc';       // Criterio por defecto A-Z

  id: number | null = null;
  nombre = '';
  descripcion = '';
  precio: number | null = null;
  stock: number | null = null;

  guardando = false;
  error = '';

  constructor(
    private sqlite: SqliteService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
     addIcons({
      add,
      createOutline,
      trashOutline,
      cubeOutline
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.sqlite.inicializar();
      await this.cargarProductos();
    } catch (error) {
      console.error(error);
      this.error = 'No se pudo inicializar SQLite.';
    }
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      await this.sqlite.inicializar();
      await this.cargarProductos();
    } catch (error) {
      console.error('Error al inicializar SQLite:', error);
      this.error = 'No se pudieron cargar los productos.';
      this.cdr.detectChanges();
    }
  }

  async cargarProductos(): Promise<void> {
    this.productos = await this.sqlite.listarProductos();
    this.productosFiltrados = [...this.productos];
    this.ordenarProductos(); // Aplica el orden al cargar los datos
    this.cdr.detectChanges();
  }

  // Método para ordenar alfabéticamente (A-Z y Z-A)
  ordenarProductos() {
    this.productosFiltrados.sort((a, b) => {
      const nombreA = a.nombre.toLowerCase();
      const nombreB = b.nombre.toLowerCase();

      if (nombreA < nombreB) {
        return this.criterioOrden === 'asc' ? -1 : 1;
      }
      if (nombreA > nombreB) {
        return this.criterioOrden === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  async guardar(): Promise<void> {
    if (this.guardando) {
      return;
    }

    if (
      !this.nombre.trim() ||
      this.precio === null ||
      this.precio < 0 ||
      this.stock === null ||
      this.stock < 0 ||
      !Number.isInteger(this.stock)
    ) {
      this.error =
        'Ingresá un nombre, precio válido y stock entero no negativo.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.cdr.detectChanges();

    try {
      await this.sqlite.inicializar();

      if (this.id === null) {
        await this.sqlite.insertarProducto(
          this.nombre.trim(),
          this.descripcion.trim(),
          this.precio,
          this.stock
        );
      } else {
        await this.sqlite.actualizarProducto(
          this.id,
          this.nombre.trim(),
          this.descripcion.trim(),
          this.precio,
          this.stock
        );
      }

      await this.cargarProductos();
      this.limpiarFormulario();

    } catch (error) {
      console.error('Error al guardar producto:', error);
      this.error = 'No se pudo guardar el producto.';
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  editar(producto: Producto): void {
    this.id = producto.id;
    this.nombre = producto.nombre;
    this.descripcion = producto.descripcion ?? '';
    this.precio = producto.precio;
    this.stock = producto.stock;
    this.error = '';
  }

  async eliminar(producto: Producto): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: `¿Deseás eliminar "${producto.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.confirmarEliminacion(producto.id);
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmarEliminacion(
    id: number
  ): Promise<void> {
    try {
      await this.sqlite.eliminarProducto(id);
      await this.cargarProductos();

      if (this.id === id) {
        this.limpiarFormulario();
      }
    } catch (error) {
      console.error(error);
      this.error = 'No se pudo eliminar el producto.';
    }
  }

  limpiarFormulario(): void {
    this.id = null;
    this.nombre = '';
    this.descripcion = '';
    this.precio = null;
    this.stock = null;
    this.error = '';
  }
}