import common from "./common";
import navigation from "./navigation";
import auth from "./auth";
import cart from "./cart";
import checkout from "./checkout";
import orders from "./orders";
import products from "./products";
import profile from "./profile";
import reviews from "./reviews";
import admin from "./admin";
import validation from "./validation";
import notifications from "./notifications";
import home from "./home";

const all = {
  ...common,
  ...home,
  ...navigation,
  ...auth,
  ...cart,
  ...checkout,
  ...orders,
  ...products,
  ...profile,
  ...reviews,
  ...admin,
  ...validation,
  ...notifications,
  common,
  home,
  navigation,
  auth,
  cart,
  checkout,
  orders,
  products,
  profile,
  reviews,
  admin,
  validation,
  notifications,
};

export default {
  common: all,
  home,
  navigation,
  auth,
  cart,
  checkout,
  orders,
  products,
  profile,
  reviews,
  admin,
  validation,
  notifications,
};
