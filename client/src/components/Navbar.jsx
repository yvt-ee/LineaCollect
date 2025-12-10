import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { fetchProducts } from "../api/ProductsAPI";
import cartEvents from "../utils/cartEvents";
import api from "../api/axiosInstance";         // ⭐ 必须加
import { useAuth } from "../context/AuthContext"; // ⭐ 必须加

export default function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();                     // ⭐ 获取登录用户

  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const wrapRef = useRef(null);
  const DEBOUNCE_MS = 150;

  /* ----------------------------------
        Load Cart Count (guest + user)
  ---------------------------------- */
  useEffect(() => {
    async function loadCartCount() {
      if (!user) {
        const guest = JSON.parse(localStorage.getItem("guestCart") || "[]");
        const total = guest.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(total);
        return;
      }

      try {
        const res = await api.get("/cart");
        const items = res.data.items || [];
        const total = items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(total);
      } catch (err) {
        console.error("❌ Failed to load user cart", err);
      }
    }

    loadCartCount();

    cartEvents.on("changed", loadCartCount);
    return () => cartEvents.off("changed", loadCartCount);
  }, [user]);


  /* ----------------------------------
        Load all products for search
  ---------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts();
        setAllProducts(data || []);
      } catch {
        setAllProducts([]);
      }
    })();
  }, []);

  /* ----------------------------------
        Close search dropdown if click outside
  ---------------------------------- */
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current || wrapRef.current.contains(e.target)) return;
      setOpen(false);
      setActiveIdx(-1);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* ----------------------------------
        Debounced search
  ---------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) {
        setSuggestions([]);
        setOpen(false);
        setActiveIdx(-1);
        return;
      }

      const needle = q.toLowerCase();
      const list = allProducts
        .filter((p) =>
          [p.name, p.brandname, p.category, p.description]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
        .slice(0, 6);

      setSuggestions(list);
      setOpen(list.length > 0);
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [q, allProducts]);

  const categories = [
    "New In",
    "Best Sellers",
    "Earring",
    "Necklace",
    "Ring",
    "Bracelet",
    "About Us",
    "Sale",
  ];

  const submitSearch = (e) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;

    navigate(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % (suggestions.length + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(
        (i) => (i - 1 + (suggestions.length + 1)) % (suggestions.length + 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (activeIdx === -1 || activeIdx === suggestions.length) {
        submitSearch();
      } else {
        const s = suggestions[activeIdx];
        navigate(`/product/${s.slug}`);
        setOpen(false);
      }
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-top">
        {/* Search */}
        <div className="search-wrapper" ref={wrapRef}>
          <form className="nav-search" onSubmit={submitSearch} role="search">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q && suggestions.length && setOpen(true)}
              onKeyDown={onKeyDown}
            />
          </form>

          {open && (
            <ul className="search-dropdown">
              {suggestions.map((p, idx) => (
                <li
                  key={p.id}
                  className={
                    "search-suggestion" + (idx === activeIdx ? " active" : "")
                  }
                  onMouseDown={() => {
                    navigate(`/product/${p.slug}`);
                    setOpen(false);
                  }}
                >
                  <img src={p.main_image} className="suggestion-thumb" />
                  <div className="suggestion-info">
                    <span className="suggestion-name">{p.name}</span>
                    <span className="suggestion-brand">
                      {p.brandname} · {p.category}
                    </span>
                  </div>
                </li>
              ))}

              <li
                className={
                  "search-suggestion view-all" +
                  (activeIdx === suggestions.length ? " active" : "")
                }
                onMouseDown={submitSearch}
              >
                View all results for “{q.trim()}”
              </li>
            </ul>
          )}
        </div>

        <Link to="/" className="brand">
          Linea Collect
        </Link>

        <div className="nav-actions">
          <Link to="/account" className="nav-action">
            Account
          </Link>

          <Link to="/cart" className="nav-action cart-link">
            Cart <span className="cart-badge">{cartCount}</span>
          </Link>
        </div>
      </div>

      <div className="nav-bottom">
        <ul className="cat-list">
          {categories.map((cat) => {
            const to =
              cat === "About Us"
                ? "/about-us"
                : `/category/${cat.toLowerCase().replace(/\s+/g, "-")}`;

            return (
              <li key={cat}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    "cat-link" + (isActive ? " active" : "")
                  }
                >
                  {cat}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
