/** @format */

import React, { useEffect, useState, lazy, Suspense } from "react";
import { Route, BrowserRouter, Switch, useLocation } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-quill/dist/quill.snow.css";
import ReactGA from "react-ga4";
import Footer from "./Footer";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NavbarTop = lazy(() => import("./NavbarUpdate/NavbarTop"));
const NavbarBottom = lazy(() => import("./NavbarUpdate/NavbarBottom"));
const Home = lazy(() => import("./pages/Home/Home"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const RetExchPolicy = lazy(() => import("./pages/RetExchPolicy"));
const About = lazy(() => import("./pages/About/About"));
const Cart = lazy(() => import("./pages/Checkout/Cart"));
const AdminDashboard = lazy(
	() => import("./Admin/AdminMainDashboard/AdminDashboard")
);
const AdminRoute = lazy(() => import("./auth/AdminRoute"));
const CategoriesMain = lazy(() => import("./Admin/Categories/CategoriesMain"));
const SubcategoryMain = lazy(
	() => import("./Admin/Subcategory/SubcategoryMain")
);
const ParentMain = lazy(() => import("./Admin/Gender/GenderMain"));
const AttributesMain = lazy(() => import("./Admin/Attributes/AttributesMain"));
const ProductMain = lazy(() => import("./Admin/Product/ProductMain"));
const StoreSettingsMain = lazy(
	() => import("./Admin/StoreSettings/StoreSettingsMain")
);
const EditWebsiteMain = lazy(
	() => import("./Admin/EditingWebsite/EditWebsiteMain")
);
const CustomerServiceSupportMain = lazy(
	() => import("./Admin/Chat/CustomerServiceSupportMain")
);
const StorePOSMain = lazy(() => import("./Admin/StorePOS/StorePOSMain"));
const PrivateRoute = lazy(() => import("./auth/PrivateRoute"));
const UserDashboard = lazy(() => import("./User/UserDashboard"));
const SingleProductMain = lazy(
	() => import("./pages/SingleProduct/SingleProductMain")
);
const ShopPageMain = lazy(() => import("./pages/ShopPage/ShopPageMain"));
const ContactUs = lazy(() => import("./pages/Contact/ContactUs"));
const ChatIcon = lazy(() => import("./Chat/ChatIcon"));
const LinkGenerated = lazy(() => import("./Admin/StorePOS/LinkGenerated"));
const CouponManagement = lazy(
	() => import("./Admin/CouponManagement/CouponManagement")
);

const App = () => {
	const location = useLocation();
	const [language, setLanguage] = useState("English");

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send({
			hitType: "pageview",
			page: location.pathname + location.search,
		});
		setLanguage("English");
	}, [location]);

	const languageToggle = () => {
		localStorage.setItem("lang", JSON.stringify(language));
	};

	useEffect(() => {
		languageToggle();
		// eslint-disable-next-line
	}, [language]);

	useEffect(() => {
		if (!location.pathname.includes("/checkout")) {
			localStorage.removeItem("PaidNow");
			localStorage.removeItem("storedData");
			localStorage.removeItem("chosenShippingOption");
			localStorage.removeItem("orderDataStored");
		}
	}, [location]);

	// const options = {
	// 	autoConfig: true,
	// 	debug: false,
	// };

	// useEffect(() => {
	// 	ReactPixel.init(process.env.REACT_APP_FACEBOOK_PIXEL_ID, options);
	// 	ReactPixel.pageView();
	// }, []);

	return (
		<BrowserRouter>
			<ToastContainer className='toast-top-center' position='top-center' />
			{!location.pathname.includes("admin") && (
				<Suspense fallback={<div>Loading...</div>}>
					<NavbarTop />
					<NavbarBottom />
				</Suspense>
			)}

			<Suspense fallback={<div>Loading...</div>}>
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
					<Route
						path='/privacy-policy-terms-conditions'
						exact
						component={PrivacyPolicy}
					/>
					<Route path='/cookie-policy' exact component={CookiePolicy} />
					<Route
						path='/return-exchange-policy'
						exact
						component={RetExchPolicy}
					/>
					<Route path='/signup' exact component={Register} />
					<Route path='/signin' exact component={Login} />
					<Route path='/cart' exact component={Cart} />
					<Route
						path='/payment-link/:orderId'
						exact
						component={LinkGenerated}
					/>

					<AdminRoute
						path='/admin/dashboard'
						exact
						component={AdminDashboard}
					/>
					<AdminRoute
						path='/admin/categories'
						exact
						component={CategoriesMain}
					/>
					<AdminRoute path='/admin/gender' exact component={ParentMain} />
					<AdminRoute
						path='/admin/attributes'
						exact
						component={AttributesMain}
					/>
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
					<AdminRoute path='/admin/store-pos' exact component={StorePOSMain} />
					<AdminRoute
						path='/admin/coupon-management'
						exact
						component={CouponManagement}
					/>
					<PrivateRoute path='/dashboard' exact component={UserDashboard} />
				</Switch>
			</Suspense>

			{!location.pathname.includes("admin") && (
				<Suspense fallback={<div>Loading...</div>}>
					<ChatIcon />
					<Footer />
				</Suspense>
			)}
		</BrowserRouter>
	);
};

export default App;
