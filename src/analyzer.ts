import { DataStore } from './datastore'

export class Analyzer {
  private _store: DataStore

  constructor() {
    this._store = new DataStore()
  }
}