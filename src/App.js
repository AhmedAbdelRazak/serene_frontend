import React, { useEffect, Suspense, lazy, startTransition } from "react";
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
import ReactPixel from "react-facebook-pixel";

import NavbarTop from "./NavbarUpdate/NavbarTop";
import NavbarBottom from "./NavbarUpdate/NavbarBottom";
import Footer from "./Footer";
// eslint-disable-next-line
// import AnimationWalkingComponent from "./pages/MyAnimationComponents/AnimationWalkingComponent";
// eslint-disable-next-line
// import AnimationKickoff from "./pages/MyAnimationComponents/AnimationKickoff";
// eslint-disable-next-line
// import AnimationWalkingGreeting from "./pages/MyAnimationComponents/AnimationWalkingGreeting";
// import AnimationProductPresentation from "./pages/MyAnimationComponents/AnimationProductPresentation";

import ModalApp from "./ModalApp";

const SellerDashboardMain = lazy(
	() => import("./Seller/SellerDashboard/SellerDashboardMain")
);

const SellerStoreManagementMain = lazy(
	() => import("./Seller/StoreManagement/SellerStoreManagementMain")
);

const SellerProductManagementMain = lazy(
	() => import("./Seller/ProductManagement/SellerProductManagementMain")
);

const CustomerServiceSellerMain = lazy(
	() => import("./Seller/CustomerService/CustomerServiceSellerMain")
);

const CouponManagementMain = lazy(
	() => import("./Seller/CouponManagement/CouponManagementMain")
);

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
const RegisterSeller = lazy(() => import("./pages/RegisterSeller"));
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
const AdminStoreManagementMain = lazy(
	() => import("./Admin/StoreManagement/AdminStoreManagementMain")
);

const CustomerServiceMainAdmin = lazy(
	() => import("./Admin/CustomerService/CustomerServiceMainAdmin")
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
const SellerRoute = lazy(() => import("./auth/SellerRoute"));
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
	const PixelRouteTracker = () => {
		const location = useLocation();

		useEffect(() => {
			// Trigger PageView event on route change
			ReactPixel.pageView(); // Logs the page view
			ReactPixel.track("PageView", { path: location.pathname }); // Optionally add path as a parameter
		}, [location]);

		return null;
	};

	useEffect(() => {
		// Initialize Facebook Pixel with ID from .env
		ReactPixel.init(process.env.REACT_APP_FACEBOOK_PIXEL_ID);

		// Trigger the initial page view when the app loads
		ReactPixel.pageView();
	}, []);

	return (
		<>
			<ToastContainer className='toast-top-center' position='top-center' />
			<Suspense fallback={<div>Loading...</div>}>
				<PixelRouteTracker />
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
					<Route path='/sellingagent/signup' exact component={RegisterSeller} />
					<Route path='/signin' exact component={Login} />
					<Route path='/cart' exact component={Cart} />
					{/* <Route
						path='/my-animation-component'
						exact
						component={AnimationWalkingComponent}
					/>
					<Route
						path='/my-animation-component2'
						exact
						component={AnimationKickoff}
					/> */}

					{/* <Route
						path='/my-animation-component3'
						exact
						component={AnimationWalkingGreeting}
					/> */}

					{/* <Route
						path='/my-animation-component4'
						exact
						component={AnimationProductPresentation}
					/> */}
					<Route
						path='/payment-link/:orderId'
						exact
						component={LinkGenerated}
					/>
					{/* Seller Routes */}
					<SellerRoute
						path='/seller/dashboard'
						exact
						component={SellerDashboardMain}
					/>
					<SellerRoute
						path='/seller/store-management'
						exact
						component={SellerStoreManagementMain}
					/>

					<SellerRoute
						path='/seller/products-management'
						exact
						component={SellerProductManagementMain}
					/>

					<SellerRoute
						path='/seller/customer-service'
						exact
						component={CustomerServiceSellerMain}
					/>

					<SellerRoute
						path='/seller/coupon-management'
						exact
						component={CouponManagementMain}
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
						component={CustomerServiceMainAdmin}
					/>
					<AdminRoute
						path='/admin/store-management'
						exact
						component={() => <AdminStoreManagementMain />}
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

			<ModalApp shouldHideLayout={shouldHideLayout} location={location} />
		</>
	);
};

export default App;
