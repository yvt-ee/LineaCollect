const renderProducts = async () => {

    const response = await fetch('/products')
    const data = await response.json()

    const mainContent = document.getElementById('main-content')

    if (data) {

        data.map(product => {
            const card = document.createElement('div')
            card.classList.add('card')

            const topContainer = document.createElement('div')
            topContainer.classList.add('top-container')

            const bottomContainer = document.createElement('div')
            bottomContainer.classList.add('bottom-container')

            topContainer.style.backgroundImage = `url(${product.image})`

            const brandName = document.createElement('h3')
            brandName.textContent = product.brandName
            bottomContainer.appendChild(brandName)

            const priceRange = document.createElement('p')
            priceRange.textContent = 'Price Range: ' + product.priceRange
            bottomContainer.appendChild(priceRange)

            const category = document.createElement('p')
            category.textContent = 'Category: ' + product.category
            bottomContainer.appendChild(category)

            const link = document.createElement('a')
            link.textContent = 'Read More >'
            link.setAttribute('role', 'button')
            link.href = `/product.html?id=${product.id}`
            bottomContainer.appendChild(link)

            card.appendChild(topContainer)
            card.appendChild(bottomContainer) 
            mainContent.appendChild(card)
        })
    }
    else {
        const message = document.createElement('h2')
        message.textContent = 'No Products Available 😞'
        mainContent.appendChild(message)
    }
}

const requestedUrl = window.location.href.split('/').pop()

if (requestedUrl) {
    window.location.href = '../404.html'
} else {
    renderProducts()
}
