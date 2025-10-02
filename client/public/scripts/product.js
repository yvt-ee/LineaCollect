const renderProduct = async () => {
    // Get product id from query string
    const params = new URLSearchParams(window.location.search);
    const requestedID = params.get('id');
    const response = await fetch('/products');
    const data = await response.json();
    const productContent = document.getElementById('product-content');
    const product = data.find(product => product.id === requestedID);
    if (product) {
        document.getElementById('image').src = product.image;
        document.getElementById('brandName').textContent = product.brandName;
        document.getElementById('priceRange').textContent = 'Price Range: ' + product.priceRange;
        document.getElementById('category').textContent = 'Category: ' + product.category;
        document.getElementById('description').textContent = product.description;
        document.title = `LineaCollect - ${product.brandName}`;
    } else {
        const message = document.createElement('h2');
        message.textContent = 'No Products Available 😞';
        productContent.appendChild(message);
    }
}

renderProduct();

