const renderProducts = async () => {
    const response = await fetch('/products')
    const data = await response.json();

    const mainContent = document.getElementById('main-content')

    if(data){
        data.map(product => {
            const card = document.createElement('div')
            card.classList.add('card')
            const topContainer = document.createElement('div')
            topContainer.classList.add('top-container')
            const bottomContainer = document.createElement('div')
            bottomContainer.classList.add('bottom-container')
            topContainer.style.backgroundImage = `url(${product.image})`

            const name = document.createElement('h3')
            name.textContent = product.name
            bottomContainer.appendChild(name)

            const price = document.createElement('p')
            price.textContent = 'Price: ' + product.pricePoint
            bottomContainer.appendChild(price)

            const audience = document.createElement('p')
            audience.textContent = 'Product Audience: ' + product.audience
            bottomContainer.appendChild(audience)

            const moreButton = document.createElement('a')
            moreButton.href = `/products/${product.id}`
            moreButton.textContent = 'Read More>'
            moreButton.setAttribute('role', 'button')
            bottomContainer.appendChild(moreButton)

            card.appendChild(topContainer)
            card.appendChild(bottomContainer)
            mainContent.appendChild(card)

        })
    }
    else{
        const heading = document.createElement('h2')
        heading.textContent = "No Products Available"
        mainContent.appendChild(heading)
    }

}

const renderProduct = async() => {
        const requestedID = parseInt(window.location.href.split('/').pop())
        const response = await fetch('/products')
        const data = await response.json()

        const productContent = document.getElementById('product-content')

        let product
        if(data)
        {
            product = data.find(product => product.id === requestedID)
            document.getElementById('image').src = product.image
            document.getElementById('name').textContent = product.name
            document.getElementById('submittedBy').textContent = 'Submitted by: ' + product.submittedBy
            document.getElementById('pricePoint').textContent = 'Price: ' + product.pricePoint
            document.getElementById('audience').textContent = 'Great For: ' + product.audience
            document.getElementById('description').textContent = product.description
            document.title = `Linea Collect - ${product.name}`
        }
        else
        {
            const message = document.createElement('h2')
            message.textContent = 'No Products Available'
            productContent.appendChild(message)
        }
}
renderProducts()
renderProduct()