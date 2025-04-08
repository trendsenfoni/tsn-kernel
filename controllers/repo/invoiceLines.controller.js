const { updateInvoice } = require('./bizdoc-helper')
module.exports = (dbModel, sessionDoc, req) =>
  new Promise(async (resolve, reject) => {

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
    dbModel.invoiceLines
      .findOne({ _id: req.params.param1 })
      .populate([{ path: 'item' }])
      .then(resolve)
      .catch(reject)
  })
}

function getList(dbModel, sessionDoc, req) {
  return new Promise((resolve, reject) => {
    let options = {
      page: req.query.page || 1,
      limit: req.query.pageSize || 10,
      populate: [{
        path: 'item'
      }]
    }
    let filter = {}
    if (req.query.invoice)
      filter.invoice = req.query.invoice

    if (req.query.type)
      filter.type = req.query.type

    if (req.query.startDate && req.query.endDate) {
      filter.issueDate = { $gte: req.query.startDate, $lte: req.query.endDate }
    } else if (req.query.startDate && !req.query.endDate) {
      filter.issueDate = { $gte: req.query.startDate }
    } else if (!req.query.startDate && req.query.endDate) {
      filter.issueDate = { $lte: req.query.endDate }
    }



    dbModel.invoiceLines
      .paginate(filter, options)
      .then(resolve).catch(reject)
  })
}

function post(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      let data = req.body || {}
      delete data._id
      delete data.delivered
      delete data.remainder

      if (!data.invoice) return reject('invoice required')
      if (!data.item) return reject('item required')
      if ((data.invoicedQuantity || 0) <= 0) return reject('invoicedQuantity must be greater than zero')
      if ((data.price || 0) < 0) return reject('price must be greater or equal to zero')

      let invoiceDoc = await dbModel.invoices.findOne({ _id: data.invoice })
      if (!invoiceDoc) return reject(`invoice not found`)

      let itemDoc = await dbModel.items.findOne({ _id: data.item })
      if (!itemDoc) return reject(`item not found`)

      data.ioType = invoiceDoc.ioType
      data.issueDate = invoiceDoc.issueDate
      data.issueTime = invoiceDoc.issueTime
      data.currency = invoiceDoc.currency

      const doc = new dbModel.invoiceLines(data)
      if ((doc.total || 0) <= 0) {
        doc.total = Math.round(100 * (doc.price || 0) * doc.quantity) / 100
      }

      doc.taxAmount = Math.round(100 * doc.total * (doc.taxRate || 0) / 100) / 100
      doc.withHoldingTaxAmount = Math.round(100 * doc.taxAmount * (doc.withHoldingTaxRate || 0)) / 100
      doc.taxInclusiveTotal = Math.round(100 * (doc.total + doc.taxAmount - doc.withHoldingTaxAmount)) / 100

      if (!epValidateSync(doc, reject)) return

      doc.save()
        .then(async newDoc => {
          await updateInvoice(dbModel, newDoc.invoice._id)
          newDoc = newDoc.populate(['item'])
          resolve(newDoc)
        })
        .catch(reject)
    } catch (err) {
      reject(err)
    }

  })
}

function put(dbModel, sessionDoc, req) {
  return new Promise(async (resolve, reject) => {
    try {

      if (req.params.param1 == undefined) return restError.param1(req, reject)
      let data = req.body || {}
      delete data._id
      delete data.delivered
      delete data.remainder
      delete data.invoice

      if (!data.item) return reject('item required')
      if ((data.invoicedQuantity || 0) <= 0) return reject('invoicedQuantity must be greater than zero')
      if ((data.price || 0) < 0) return reject('price must be greater or equal to zero')

      let doc = await dbModel.invoiceLines.findOne({ _id: req.params.param1 })
      if (!doc) return reject(`record not found`)

      let invoiceDoc = await dbModel.invoices.findOne({ _id: doc.invoice })
      if (!invoiceDoc) return reject(`invoice not found`)

      let itemDoc = await dbModel.items.findOne({ _id: data.item })
      if (!itemDoc) return reject(`item not found`)



      doc = Object.assign(doc, data)
      doc.ioType = invoiceDoc.ioType
      doc.issueDate = invoiceDoc.issueDate
      doc.issueTime = invoiceDoc.issueTime
      doc.currency = invoiceDoc.currency
      if ((doc.lineExtensionAmount || 0) <= 0) {
        doc.lineExtensionAmount = Math.round(100 * (doc.price || 0) * doc.invoicedQuantity) / 100
      }

      // doc.taxAmount = Math.round(100 * doc.total * (doc.taxRate || 0) / 100) / 100
      // doc.withHoldingTaxAmount = Math.round(100 * doc.taxAmount * (doc.withHoldingTaxRate || 0)) / 100
      // doc.taxInclusiveTotal = Math.round(100 * (doc.total + doc.taxAmount - doc.withHoldingTaxAmount)) / 100

      if (!epValidateSync(doc, reject)) return
      // if (await dbModel.invoiceLines.countDocuments({ name: doc.name, _id: { $ne: doc._id } }) > 0)
      //   return reject(`name already exists`)

      doc.save()
        .then(async newDoc => {
          await updateInvoice(dbModel, newDoc.invoice)
          newDoc = newDoc.populate(['item'])
          resolve(newDoc)
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
      if (!req.params.param1)
        return restError.param1(req, reject)
      const invoiceLinesDoc = await dbModel.invoiceLines.findOne({ _id: req.params.param1 })
      if (!invoiceLinesDoc)
        return reject(`invoiceLines document not found`)




      dbModel.invoiceLines.removeOne(sessionDoc, { _id: req.params.param1 })
        .then(async result => {
          if (invoiceLinesDoc.invoice) {
            await updateInvoice(dbModel, invoiceLinesDoc.invoice)
          }

          resolve(result)
        })
        .catch(reject)
    } catch (err) {
      reject(err)
    }
  })
}

