import React from "react";

export default function StarRating({ rating, setRating, readonly }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="stars">
      {stars.map((s) => (
        <span
          key={s}
          className={s <= rating ? "star filled" : "star"}
          onClick={() => !readonly && setRating(s)}
          style={{ cursor: readonly ? "default" : "pointer", fontSize: "22px" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
