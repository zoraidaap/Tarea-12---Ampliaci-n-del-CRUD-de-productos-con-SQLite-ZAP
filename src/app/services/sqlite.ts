
import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  fecha_creacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite =
    new SQLiteConnection(CapacitorSQLite);

  private db!: SQLiteDBConnection;
  private inicializacion?: Promise<void>;

  async inicializar(): Promise<void> {
    if (this.inicializacion) {
      return this.inicializacion;
    }

    this.inicializacion = this.crearBaseDatos();

    try {
      await this.inicializacion;
    } catch (error) {
      this.inicializacion = undefined;
      throw error;
    }
  }

  private async crearBaseDatos(): Promise<void> {
    const existe = await this.sqlite.isConnection(
      'inventario',
      false
    );

    if (existe.result) {
      this.db = await this.sqlite.retrieveConnection(
        'inventario',
        false
      );
    } else {
      this.db = await this.sqlite.createConnection(
        'inventario',
        false,
        'no-encryption',
        1,
        false
      );
    }

    await this.db.open();

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio REAL NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        fecha_creacion TEXT NOT NULL
          DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async listarProductos(): Promise<Producto[]> {
    const resultado = await this.db.query(`
      SELECT * FROM productos ORDER BY id DESC
    `);

    return (resultado.values ?? []) as Producto[];
  }

  async obtenerProducto(id: number): Promise<Producto | null> {
    const resultado = await this.db.query(
      'SELECT * FROM productos WHERE id = ?',
      [id]
    );

    return (resultado.values?.[0] as Producto) ?? null;
  }

  async insertarProducto(
    nombre: string,
    descripcion: string,
    precio: number,
    stock: number
  ): Promise<void> {
    await this.db.run(
      `INSERT INTO productos
        (nombre, descripcion, precio, stock)
       VALUES (?, ?, ?, ?)`,
      [nombre, descripcion, precio, stock]
    );
  }

  async actualizarProducto(
    id: number,
    nombre: string,
    descripcion: string,
    precio: number,
    stock: number
  ): Promise<void> {
    await this.db.run(
      `UPDATE productos
       SET nombre = ?,
           descripcion = ?,
           precio = ?,
           stock = ?
       WHERE id = ?`,
      [nombre, descripcion, precio, stock, id]
    );
  }

  async eliminarProducto(id: number): Promise<void> {
    await this.db.run(
      'DELETE FROM productos WHERE id = ?',
      [id]
    );
  }
}
