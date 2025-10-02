import { pool } from './database.js'
import './dotenv.js'
import productData from '../data/products.js'

async function createProductsTable() {
    const createTableQuery = `
        DROP TABLE IF EXISTS products;

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            brandName VARCHAR(255) NOT NULL,
            priceRange VARCHAR(20) NOT NULL,
            category VARCHAR(20) NOT NULL,
            image VARCHAR(255) NOT NULL,
            description TEXT NOT NULL
        );
`

    try {
        const res = await pool.query(createTableQuery)
        console.log('🎉 products table created successfully')
    }

    catch (err) {
        console.error('⚠️ error creating products table', err)
    }
}

async function seedProductsTable() {
    await createProductsTable();

    const insertQuery = {
        text: 'INSERT INTO products (brandName, priceRange, category, image, description) VALUES ($1, $2, $3, $4, $5)'
    };

    for (const product of productData) {
        const values = [
            product.brandName,
            product.priceRange,
            product.category,
            product.image,
            product.description
        ];

        try {
            await pool.query(insertQuery, values);
            console.log(`✅ ${product.brandName} added successfully`);
        } catch (err) {
            console.error('⚠️ error inserting product', err);
        }
    }
}

seedProductsTable();