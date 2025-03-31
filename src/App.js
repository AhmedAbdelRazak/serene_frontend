import React, {
	useEffect,
	useState,
	Suspense,
	lazy,
	startTransition,
} from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	useLocation,
} from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-quill/dist/quill.snow.css";
import ReactGA from "react-ga4";
// import ReactPixel from "react-facebook-pixel";
import { Modal, Button } from "antd"; // for the modal
import NavbarTop from "./NavbarUpdate/NavbarTop";
import NavbarBottom from "./NavbarUpdate/NavbarBottom";
import Footer from "./Footer";

const PrintifyAvailableProducts = lazy(
	() => import("./pages/PrintOnDemand/PrintifyAvailableProducts")
);
const CustomizeSelectedProduct = lazy(
	() => import("./pages/PrintOnDemand/CustomizeSelectedProduct")
);
const PrintifyMain = lazy(
	() => import("./Admin/PrintifyProductManagement/PrintifyMain")
);
const WebsiteMain = lazy(() => import("./Admin/EditingWebsite/WebsiteMain"));

// Lazy load components
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home/Home")); // We'll possibly pre-import below
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

/**
 * Main <App /> wraps the Router,
 * then delegates main logic to <AppContent />
 * so we can use useLocation() inside <AppContent />.
 */
const App = () => {
	// (Optional) "pre-import" the Home page chunk if you suspect most users start at "/"
	// This doesn't block initial render, but requests the chunk in parallel
	// so if the user hits "/", there's less to load on route change.
	// Check network logs to ensure it doesn't hamper performance if user seldom visits "/".
	startTransition(() => {
		Home.preload?.();
	});

	return (
		<Router>
			<AppContent />
		</Router>
	);
};

const AppContent = () => {
	const location = useLocation(); // get current route info
	const [isModalVisible, setIsModalVisible] = useState(false);

	// Determine if path includes 'admin' or 'seller'
	const shouldHideLayout =
		location.pathname.includes("admin") || location.pathname.includes("seller");

	// Initialize GA ONCE at app start
	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
	}, []);

	// Send pageview to GA every time route changes
	useEffect(() => {
		ReactGA.send({ hitType: "pageview", page: location.pathname });
	}, [location]);

	// Clear certain local storage keys unless we are on /checkout
	useEffect(() => {
		if (!location.pathname.includes("/checkout")) {
			localStorage.removeItem("PaidNow");
			localStorage.removeItem("storedData");
			localStorage.removeItem("chosenShippingOption");
			localStorage.removeItem("orderDataStored");
		}
		// no eslint-disable-next-line needed, location is in deps
	}, [location]);

	// Facebook Pixel Setup
	// const options = {
	//   autoConfig: true,
	//   debug: false,
	// };

	// useEffect(() => {
	//   ReactPixel.init(process.env.REACT_APP_FACEBOOK_PIXEL_ID, options);
	//   ReactPixel.pageView();
	//   // eslint-disable-next-line
	// }, []);

	// ==================== 7-second one-time Modal logic ====================
	useEffect(() => {
		// 1. Skip if current route includes admin or seller
		if (shouldHideLayout) return;

		// 2. Skip if route contains "custom"
		if (location.pathname.includes("custom")) return;

		// 3. If user already dismissed => do nothing.
		const hasSeenModal = localStorage.getItem("customGiftModalDismissed");
		if (hasSeenModal) return;

		// 4. If user is on checkout => skip
		if (location.pathname.includes("/checkout")) return;

		// 5. Set a timer
		const timer = setTimeout(() => {
			setIsModalVisible(true);
		}, 4000);

		return () => clearTimeout(timer); // cleanup
	}, [location, shouldHideLayout]);

	const handleYes = () => {
		localStorage.setItem("customGiftModalDismissed", "true");
		// GA event
		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked YES - show me /custom-gifts",
		});
		// Redirect
		window.location.href = "/custom-gifts";
	};

	const handleNo = () => {
		localStorage.setItem("customGiftModalDismissed", "true");
		// GA event
		ReactGA.event({
			category: "Custom Gift Modal",
			action: "User clicked NO - not interested",
		});
		setIsModalVisible(false);
	};

	const modalText =
		"Your loved ones deserve just 3 minutes of your time to create their perfect gift. Click below to be unique! ❤️😉";

	//Add Expenses to each order line
	//Chat icon adjustment
	//Signin With google
	//Adding Seller Signup page
	//Adding Seller Dashboard (CRUD Product, CRUD Order)

	return (
		<>
			<ToastContainer className='toast-top-center' position='top-center' />
			<Suspense fallback={<div>Loading...</div>}>
				{/* Only show Navbars if NOT admin/seller */}
				{!shouldHideLayout && (
					<>
						<NavbarTop />
						<NavbarBottom />
					</>
				)}

				<Switch>
					<Route path='/' exact component={() => <Home />} />
					<Route path='/about' exact component={() => <About />} />
					<Route
						path='/single-product/:productSlug/:categorySlug/:productId'
						exact
						component={() => <SingleProductMain />}
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

					{/* Admin Routes */}
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
						component={WebsiteMain}
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

					{/* User (Private) Routes */}
					<PrivateRoute path='/dashboard' exact component={UserDashboard} />
				</Switch>

				{/* Chat & Footer only if NOT admin/seller */}
				{!shouldHideLayout && <ChatIcon />}
				{!shouldHideLayout && <Footer />}
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
					style={{
						fontSize: "1.1rem",
						textAlign: "center",
						margin: "20px 0",
					}}
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
		</>
	);
};

export default App;
