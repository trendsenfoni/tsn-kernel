const userDbPrefix = process.env.USERDB_PREFIX || 'aabi_'
module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {
    if (!['GET', 'PATCH'].includes(req.method) && !sessionDoc) {
      return restError.session(req, reject)
    }

    switch (req.method.toUpperCase()) {
      case 'GET':
        if (req.params.param1 != undefined) {
          getOne(dbModel, sessionDoc, req).then(resolve).catch(reject)
        } else {
          getList(dbModel, sessionDoc, req).then(resolve).catch(reject)
        }
        break
      case 'POST':
        post(dbModel, sessionDoc, req).then(resolve).catch(reject)

        break
      case 'PUT':
        put(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      case 'DELETE':
        deleteItem(dbModel, sessionDoc, req).then(resolve).catch(reject)
        break
      default:
        restError.method(req, reject)
        break
    }
  })

function getOne(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    dbModel.databases
      .findOne({ _id: req.params.param1, owner: sessionDoc.member })
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let options = {
      page: req.query.page || 1,
      limit: req.query.pageSize || 10
    }
    let filter = {
      $or: [
        { owner: sessionDoc.member },
        { 'team.teamMember': sessionDoc.member }
      ],
      passive: false
    }
    dbModel.databases
      .paginate(filter, options)
      .then(result => {
        result.docs.forEach(e => {
          if (e.owner.toString() == sessionDoc.member.toString()) {
            e.isAdmin = true
          } else {
            e.isAdmin = false
          }
        })
        resolve(result)
      }).catch(reject)
  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    let data = req.body || {}
    delete data._id
    if (!data.name) return reject('name required')
    const c = await dbModel.databases.countDocuments({ owner: sessionDoc.member, name: data.name })
    if (c > 0) return reject(`name already exists`)

    data.identifier = await generateDatabaseIdentifier(data.name)
    data.dbHost = process.env.MONGODB_SERVER1_URI || 'mongodb://localhost:27017/'
    data.dbName = userDbPrefix + data.identifier
    data.owner = sessionDoc.member
    const newDoc = new dbModel.databases(data)

    if (!epValidateSync(newDoc, reject)) return
    newDoc.save().then(resolve).catch(reject)
  })
}

function put(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      if (req.params.param1 == undefined) return restError.param1(req, reject)
      let data = req.body || {}
      delete data._id
      delete data.dbHost
      delete data.dbName

      let dbDoc = await dbModel.databases.findOne({ _id: req.params.param1, owner: sessionDoc.member })
      if (!dbDoc) return reject(`database not found or permission denied`)

      dbDoc = Object.assign(dbDoc, data)
      if (!epValidateSync(dbDoc, reject)) return
      if (await dbModel.databases.countDocuments({ owner: sessionDoc.member, name: dbDoc.name, _id: { $ne: dbDoc._id } }) > 0)
        return reject(`name already exists`)
      if (await dbModel.databases.countDocuments({ identifier: dbDoc.identifier, _id: { $ne: dbDoc._id } }) > 0)
        return reject(`identifier already exists`)

      dbDoc.save()
        .then(result => {
          let obj = result.toJSON()
          delete obj.dbHost
          resolve(obj)
        })
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function deleteItem(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.params.param1 == undefined) return restError.param1(req, reject)
      let dbDoc = await dbModel.databases.findOne({
        _id: req.params.param1,
        owner: sessionDoc.member,
        passive: false
      })
      if (!dbDoc) return reject(`database not found or permission denied`)
      dbDoc.passive = true
      dbDoc
        .save()
        .then(resolve)
        .catch(reject)

    } catch (err) {
      reject(err)
    }
  })
}

async function generateDatabaseIdentifier(identifier, sayi = 0) {
  return new Promise(async (resolve, reject) => {
    identifier = identifier
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('-', '_')
      .replace(/[^a-z0-9_]/g, '')
    if (sayi > 0) {
      identifier += sayi.toString()
    }
    console.log('identifier:', identifier)

    const dbName = userDbPrefix + identifier
    const wspCount = await db.databases.countDocuments({ identifier: identifier })
    const dbNameCount = await db.databases.countDocuments({ dbName: dbName })
    if (wspCount > 0 || dbNameCount > 0) {
      generateDatabaseIdentifier(identifier, sayi + 1)
        .then(resolve)
        .catch(reject)
    } else {
      resolve(identifier)
    }

  })

}