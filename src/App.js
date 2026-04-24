import React, { useState, useMemo } from 'react';
import productsData from './data/products.json';
import Header from './components/Header';
import Filters from './components/Filters';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import './App.css';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = productsData.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = p.price >= priceRange.min && p.price <= priceRange.max; // Bug 1: Incorrect price filter logic
      const matchCategory = category === 'All' || p.category === category;
      return matchSearch && matchPrice && matchCategory;
    });

    switch (sortBy) {
      case 'price-asc': list = [...list].sort((a, b) => b.price - a.price); break; // Bug 8: Fix reversed sorting logic
      case 'price-desc': list = [...list].sort((a, b) => a.price - b.price); break; // Bug 8: Fix reversed sorting logic
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'name': list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return list;
  }, [searchQuery, priceRange, category, sortBy]); // Bug 2: Missing category dependency in useMemo

  function addToCart(product) {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  }

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(i => i.id !== id)); // Bug 3: filter method was keeping the item with the the given ID instead of removing it
  }

  function updateQty(id, qty) {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0); // Bug 4: Change i.count to i.qty
  const cartItemIds = new Set(cartItems.map(i => i.id)); // Bug 5: Change 'productId' to 'id'. cartItemIds was not being calculated because there is no property named "productID" in the cart items

  return (
    <div className="app">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartCount}
        onCartToggle={() => setCartOpen(o => !o)}
      />

      <div className="main-layout">
        <Filters
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          category={category}
          onCategoryChange={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalResults={filteredProducts.length}
        />

        <main className="product-area">
          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  inCart={cartItemIds.has(product.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {cartOpen && (
        <Cart
          items={cartItems}
          onRemove={removeFromCart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
        />
      )}
    </div>
  );
}
