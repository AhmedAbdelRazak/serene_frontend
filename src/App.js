/** @format */

import React, { useEffect, useState } from "react";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-quill/dist/quill.snow.css";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Footer from "./Footer";

//Store
import NavbarTop from "./NavbarUpdate/NavbarTop";
import NavbarBottom from "./NavbarUpdate/NavbarBottom";

// eslint-disable-next-line
import { isAuthenticated } from "./auth";
import Home from "./pages/Home/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import RetExchPolicy from "./pages/RetExchPolicy";
import About from "./pages/About/About";
import Cart from "./pages/Checkout/Cart";

//Admin Routes
import AdminDashboard from "./Admin/AdminMainDashboard/AdminDashboard";
import AdminRoute from "./auth/AdminRoute";
import CategoriesMain from "./Admin/Categories/CategoriesMain";
import SubcategoryMain from "./Admin/Subcategory/SubcategoryMain";
import ParentMain from "./Admin/Gender/GenderMain";
import AttributesMain from "./Admin/Attributes/AttributesMain";
import ProductMain from "./Admin/Product/ProductMain";
import StoreSettingsMain from "./Admin/StoreSettings/StoreSettingsMain";
import EditWebsiteMain from "./Admin/EditingWebsite/EditWebsiteMain";

//Client Routes
import PrivateRoute from "./auth/PrivateRoute";
import UserDashboard from "./User/UserDashboard";
import SingleProductMain from "./pages/SingleProduct/SingleProductMain";
import ShopPageMain from "./pages/ShopPage/ShopPageMain";
import ContactUs from "./pages/Contact/ContactUs";
import ChatIcon from "./Chat/ChatIcon";
import CustomerServiceSupportMain from "./Admin/Chat/CustomerServiceSupportMain";

const App = () => {
	// eslint-disable-next-line
	const [language, setLanguage] = useState("English");
	// eslint-disable-next-line
	const [allAdsCombined, setAllAdsCombined] = useState([]);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);

		setLanguage("English");

		// eslint-disable-next-line
	}, [window.location.pathname]);

	const languageToggle = () => {
		console.log(language);
		localStorage.setItem("lang", JSON.stringify(language));
		// window.location.reload(false);
	};

	useEffect(() => {
		languageToggle();
		// eslint-disable-next-line
	}, [language]);

	useEffect(() => {
		if (window.location.pathname.includes("/checkout")) {
			return;
		} else {
			localStorage.removeItem("PaidNow");
			localStorage.removeItem("storedData");
			localStorage.removeItem("chosenShippingOption");
			localStorage.removeItem("orderDataStored");
		}

		// eslint-disable-next-line
	}, []);

	const options = {
		autoConfig: true,
		debug: false,
	};

	useEffect(() => {
		ReactPixel.init(process.env.REACT_APP_FACEBOOK_PIXEL_ID, options);

		ReactPixel.pageView();

		// eslint-disable-next-line
	}, []);

	return (
		<BrowserRouter>
			<ToastContainer className='toast-top-center' position='top-center' />

			{window.location.pathname.includes("admin") ? null : (
				<>
					<NavbarTop />

					<NavbarBottom />
				</>
			)}

			<Switch>
				<Route
					path='/'
					exact
					component={() => <Home chosenLanguage={language} />}
				/>

				<Route
					path='/about'
					exact
					component={() => <About chosenLanguage={language} />}
				/>

				<Route
					path='/single-product/:productSlug/:categorySlug/:productId'
					exact
					component={() => <SingleProductMain chosenLanguage={language} />}
				/>

				<Route path='/our-products' exact component={ShopPageMain} />
				<Route path='/contact' exact component={ContactUs} />

				<Route path='/privacy-policy' exact component={PrivacyPolicy} />
				<Route path='/cookie-policy' exact component={CookiePolicy} />
				<Route path='/return-exchange-policy' exact component={RetExchPolicy} />
				<Route path='/signup' exact component={Register} />
				<Route path='/signin' exact component={Login} />
				<Route path='/cart' exact component={Cart} />

				<AdminRoute path='/admin/dashboard' exact component={AdminDashboard} />
				<AdminRoute path='/admin/categories' exact component={CategoriesMain} />
				<AdminRoute path='/admin/gender' exact component={ParentMain} />
				<AdminRoute path='/admin/attributes' exact component={AttributesMain} />
				<AdminRoute path='/admin/products' exact component={ProductMain} />
				<AdminRoute
					path='/admin/customer-service'
					exact
					component={CustomerServiceSupportMain}
				/>

				<AdminRoute
					path='/admin/store-management'
					exact
					component={() => <StoreSettingsMain />}
				/>
				<AdminRoute
					path='/admin/subcategories'
					exact
					component={SubcategoryMain}
				/>
				<AdminRoute
					path='/admin/website-management'
					exact
					component={EditWebsiteMain}
				/>
				<PrivateRoute path='/dashboard' exact component={UserDashboard} />
			</Switch>
			<ChatIcon />

			{window.location.pathname.includes("admin") ? null : (
				<>
					<Footer />
				</>
			)}
		</BrowserRouter>
	);
};

export default App;
