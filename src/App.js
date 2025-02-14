import React, { useEffect, useState, Suspense, lazy } from "react";
import { Route, BrowserRouter, Switch } from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-quill/dist/quill.snow.css";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import { Modal, Button } from "antd"; // for the modal
import NavbarTop from "./NavbarUpdate/NavbarTop";
import NavbarBottom from "./NavbarUpdate/NavbarBottom";
import Footer from "./Footer";
import PrintifyAvailableProducts from "./pages/PrintOnDemand/PrintifyAvailableProducts";
import CustomizeSelectedProduct from "./pages/PrintOnDemand/CustomizeSelectedProduct";
import PrintifyMain from "./Admin/PrintifyProductManagement/PrintifyMain";

// Lazy load components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home/Home"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const ReturnRefundPolicy = lazy(() => import("./pages/ReturnRefundPolicy"));
const About = lazy(() => import("./pages/About/About"));
const Cart = lazy(() => import("./pages/Checkout/Cart"));
const AdminDashboard = lazy(
	() => import("./Admin/AdminMainDashboard/AdminDashboard")
);
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
const AdminRoute = lazy(() => import("./auth/AdminRoute"));
const PrivateRoute = lazy(() => import("./auth/PrivateRoute"));

const App = () => {
	const [language, setLanguage] = useState("English");

	// === Modal state ===
	const [isModalVisible, setIsModalVisible] = useState(false);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);

		setLanguage("English");
		// eslint-disable-next-line
	}, [window.location.pathname]);

	const languageToggle = () => {
		localStorage.setItem("lang", JSON.stringify(language));
	};

	useEffect(() => {
		languageToggle();
		// eslint-disable-next-line
	}, [language]);

	useEffect(() => {
		// Clear certain local storage keys unless on /checkout
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

	// ==================== 7-second one-time Modal logic ====================
	useEffect(() => {
		// 1. Skip if current route is admin.
		if (window.location.pathname.includes("admin")) return;

		// 2. Skip if current route contains "custom".
		if (window.location.pathname.includes("custom")) return;

		// 3. If user already dismissed => do nothing.
		const hasSeenModal = localStorage.getItem("customGiftModalDismissed");
		if (hasSeenModal) return;

		// 4. If user is on checkout => skip.
		if (window.location.pathname.includes("/checkout")) return;

		// 5. Set a 7-second timer:
		const timer = setTimeout(() => {
			setIsModalVisible(true);
		}, 4000);

		return () => clearTimeout(timer); // cleanup if user leaves earlier
	}, []);

	const handleYes = () => {
		// Mark as dismissed in localStorage
		localStorage.setItem("customGiftModalDismissed", "true");
		// GA event
		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked YES - show me /custom-gifts",
		});
		// redirect
		window.location.href = "/custom-gifts";
	};

	const handleNo = () => {
		// Mark as dismissed in localStorage
		localStorage.setItem("customGiftModalDismissed", "true");
		// GA event
		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked NO - not interested",
		});
		setIsModalVisible(false);
	};

	// A slightly friendlier psychological line:
	const modalText =
		"Your loved ones deserve just 3 minutes of your time to create their perfect gift. Click below to be unique! ❤️😉";

	return (
		<BrowserRouter>
			<ToastContainer className='toast-top-center' position='top-center' />
			<Suspense fallback={<div>Loading...</div>}>
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
					<Route
						path='/custom-gifts'
						exact
						component={PrintifyAvailableProducts}
					/>
					<Route
						path='/custom-gifts/:productId'
						exact
						component={CustomizeSelectedProduct}
					/>
					<Route path='/contact' exact component={ContactUs} />

					<Route
						path='/privacy-policy-terms-conditions'
						exact
						component={PrivacyPolicy}
					/>
					<Route path='/cookie-policy' exact component={CookiePolicy} />
					<Route
						path='/return-refund-policy'
						exact
						component={ReturnRefundPolicy}
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
						path='/admin/printify-management'
						exact
						component={PrintifyMain}
					/>
					<AdminRoute
						path='/admin/coupon-management'
						exact
						component={CouponManagement}
					/>

					<PrivateRoute path='/dashboard' exact component={UserDashboard} />
				</Switch>

				{window.location.pathname.includes("admin") ? null : <ChatIcon />}
				{window.location.pathname.includes("admin") ? null : <Footer />}
			</Suspense>

			{/* 7-second popup modal */}
			<Modal
				open={isModalVisible}
				onCancel={handleNo}
				closable={false}
				footer={null}
				centered
			>
				<p
					style={{ fontSize: "1.1rem", textAlign: "center", margin: "20px 0" }}
				>
					{modalText}
				</p>
				<div style={{ textAlign: "center" }}>
					<Button
						type='primary'
						style={{ marginRight: 10 }}
						onClick={handleYes}
					>
						Yes, Let’s Do It!
					</Button>
					<Button onClick={handleNo}>No, Thank You</Button>
				</div>
			</Modal>
		</BrowserRouter>
	);
};

export default App;
