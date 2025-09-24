import express from 'express'
import path from 'path'
import {fileURLToPath} from 'url'
import productData from '../data/products.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const router = express.Router()

router.get('/', (req, res)=> {
    res.status(200).json(productData)
})

router.get('/:productId', (req, res)=>{
    res.status(200).sendFile(path.resolve(dirname, '../public/product.html'))
})

export default router
