import React from "react";
import ReactDOM from "react-dom/client";
import { Router, Route, Switch } from "wouter";
import "./index.css";

import AgeVerify from "./pages/AgeVerify";
import Home from "./pages/Home";
import Shorts from "./pages/Shorts";
import Search from "./pages/Search";
import Upload from "./pages/Upload";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";

const isVerified = localStorage.getItem('cumbear_age_verified') === 'true';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/" component={isVerified ? Home : AgeVerify} />
        <Route path="/verify" component={AgeVerify} />
        <Route path="/shorts" component={isVerified ? Shorts : AgeVerify} />
        <Route path="/search" component={isVerified ? Search : AgeVerify} />
        <Route path="/upload" component={isVerified ? Upload : AgeVerify} />
        <Route path="/category/:category" component={isVerified ? CategoryPage : AgeVerify} />
        <Route path="/category/:category/page/:page" component={isVerified ? CategoryPage : AgeVerify} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  </React.StrictMode>
);

