// src/utils/cartEvents.js

const cartEvents = new EventTarget();

// ⭐ 封装 emit / on / off 方法
cartEvents.emit = function (eventName, detail) {
  cartEvents.dispatchEvent(new CustomEvent(eventName, { detail }));
};

cartEvents.on = function (eventName, callback) {
  cartEvents.addEventListener(eventName, callback);
};

cartEvents.off = function (eventName, callback) {
  cartEvents.removeEventListener(eventName, callback);
};

export default cartEvents;
