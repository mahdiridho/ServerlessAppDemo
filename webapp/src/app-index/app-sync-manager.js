import 'amazon-cognito-js';

export class AppSyncManager {
  /** Constuctor set the dataset and object name want to list on sync manager
  Once aws credential ready set the cognito sync service
  Creating cognito sync manager object
  Open/Create the dataset object
  @param datasetName The dataset name
  @param objectName The dataset object name
  */
  constructor(datasetName, objectName){
    console.log('Creating cognito-sync object')
    if (typeof AWS == 'undefined')
      throw Error('the AWS object is not found');
    if (AWS.config.credentials==null)
      throw Error('AWS credentials not present');
    if (AWS.config.credentials.params.Logins==null)
      return console.log('AWS credentials type is not authenticated');
    if (!datasetName)
      throw Error('you didn\'t specify the dataset-name');
    if (!objectName)
      throw Error('you didn\'t specify the object-name');
    this.datasetName = datasetName;
    this.objectName = objectName;
    this.syncManager = new AWS.CognitoSyncManager();
    this.syncManager.openOrCreateDataset(this.datasetName, (error, dataset)=>{
      if(error)
        throw error
      else
        this.datasetRef = dataset;
    })
  }

  /** Put & sync items of dataset object
  @param items The items of dataset object
  */
  create(items){
    if (!items)
      throw Error('you didn\'t specify the object items');
    if (this.datasetRef == null)
      throw Error('the dataset object is not ready');
    console.log("CognitoSync::create: ",items)
    return new Promise((resolve, reject)=>{
      this.datasetRef.put(this.objectName, JSON.stringify(items), (error, record)=>{
        if(error)
          return reject(error)
        else
          return resolve(this.syncData())
      })
    })
  }

  /* Remove & sync the dataset */
  delete(){
    console.log('Delete dataset')
    if (this.datasetRef == null)
      throw Error('the dataset object is not ready');
    return new Promise((resolve, reject)=>{
      this.datasetRef.remove(this.objectName, (error,value)=>{
        if(error)
          return reject(error)
        else
          return resolve(this.syncData())
      })
    })
  }

  /* Get items on local dataset */
  get(){
    console.log('Get items of local dataset')
    if (this.datasetRef == null)
      throw Error('the dataset object is not ready');
    return new Promise((resolve, reject)=>{
      this.datasetRef.get(this.objectName, (error,value)=>{
        if (error)
          return reject(error)
        else
          if(value) {
            console.log(value)
            return resolve(value)
          } else
            return resolve(null)
      })
    })
  }

  /* Synchronize dataset object to cloud */
  syncData(){
    console.log('Synchronize dataset to cloud')
    if (this.datasetRef == null)
      throw Error('the dataset object is not ready');

    return new Promise((resolve, reject)=>{
      this.datasetRef.synchronize({
        onSuccess: (dataset, Records)=>{
          console.log("Dataset : ",dataset)
          return resolve(this.get())
        },
        onConflict: (dataset, conflicts, callback)=>{
          // if there are conflicts during the synchronization
          // we can resolve them in this method
          console.log(conflicts);
          let resolved = [];

          for (let i=0; i < conflicts.length; i++) {

            // Take remote version
            resolved.push(conflicts[i].resolveWithRemoteRecord());

          }

          dataset.resolve(resolved, (err)=>{
            if ( !err ) 
              return reject(callback(true));
          });
        },

        onFailure: (err)=>{
          console.log("Error while synchronizing data to the cloud: " + err);
          return reject('error')
        }
      })
    })
  }
}

window.customElements.define('app-sync-manager', AppSyncManager);