import './App.css';
import React, { useState, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';

import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Category from './pages/Category';
import PageNotFound from "./components/PageNotFound";
import Navbar from './components/Navbar';
import AboutUs from './pages/AboutUs';
import AdminProducts from './pages/AdminProducts';
import AdminUpload from './pages/AdminUpload';
import SearchResults from './pages/SearchResults';
import Cart from "./pages/Cart";
import Account from "./pages/Account";    
import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminCreateAdmin from "./pages/AdminCreateAdmin";
import AdminRoute from './components/AdminRoute';   
import { fetchProducts } from './api/ProductsAPI';

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        await fetchProducts();
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const element = useRoutes([
    { path: "/", element: <Products /> },
    { path: "/product/:slug", element: <ProductDetails /> },
    { path: "/category/:categoryName", element: <Category /> },
    { path: "/search", element: <SearchResults /> },
    { path: "/about-us", element: <AboutUs /> },
    { path: "/cart", element: <Cart /> },
    {
      path: "/admin",
      element: (
        <AdminRoute>
          <AdminProducts />
        </AdminRoute>
      )
    },

    {
      path: "/admin/upload",
      element: (
        <AdminRoute>
          <AdminUpload />
        </AdminRoute>
      )
    },
    
    {
      path: "/admin/create-admin",
      element: (
        <AdminRoute>
          <AdminCreateAdmin />
        </AdminRoute>
      )
    },


    { path: "/account", element: <Account /> },   // ⭐ Only one /account
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "*", element: <PageNotFound /> },
  ]);

  return (
    <div className="App">
      <Navbar />
      {element}
    </div>
  );
};

export default App;
