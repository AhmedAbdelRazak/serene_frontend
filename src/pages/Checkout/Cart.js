import React, { useState, useEffect } from "react";
import styled, { css, keyframes } from "styled-components";
import { useCartContext } from "../../cart_context";
import { getShippingOptions, readSingleCoupon } from "../../apiCore";
import Z1CartDetails from "./Z1CartDetails";
import Z2StepOne from "./Z2StepOne";
import Z3StepTwo from "./Z3StepTwo";
import Z4StepThree from "./Z4StepThree";
import { useHistory } from "react-router-dom";
import { isAuthenticated } from "../../auth";
import { Modal } from "antd";
import { toast } from "react-toastify";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";

const Cart = () => {
	const [step, setStep] = useState(1);
	const [customerDetails, setCustomerDetails] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		shipToName: "", // Added on 2024-07-13
	});
	const [passwordError, setPasswordError] = useState("");
	const [allShippingOptions, setAllShippingOptions] = useState([]);
	const [goodCoupon, setGoodCoupon] = useState(false);
	const [appliedCoupon, setAppliedCoupon] = useState(null);
	const [state, setState] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [zipcode, setZipCode] = useState("");
	const [comments, setComments] = useState("");
	const [coupon, setCoupon] = useState("");
	const [isModalVisible, setIsModalVisible] = useState(false);
	// eslint-disable-next-line
	const history = useHistory();
	const { user } = isAuthenticated();
	const { cart, total_amount, addShipmentDetails, shipmentChosen, removeItem } =
		useCartContext();

	const handleApplyCoupon = () => {
		readSingleCoupon(coupon)
			.then((data) => {
				if (data.error) {
					toast.error("Coupon is not available, please try another one");
					setGoodCoupon(false);
				} else if (new Date(data.expiry) < new Date()) {
					toast.error("Coupon Expired. Please Try Another One");
					setGoodCoupon(false);
				} else if (data && data.length === 0) {
					toast.error("Coupon is not available, please try another one");
					setGoodCoupon(false);
				} else {
					setGoodCoupon(true);
					setAppliedCoupon(data[0]);
				}
			})
			.catch((err) => {
				console.log(err);
				toast.error("An error occurred while applying the coupon");
			});
	};

	useEffect(() => {
		getShippingOptions().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllShippingOptions(data);
			}
		});

		if (user && user.name) {
			setStep(2);
			setCustomerDetails({
				...customerDetails,
				name: user.name,
				email: user.email,
				phone: user.phone,
			});
		}

		// eslint-disable-next-line
	}, []);

	const handleNextStep = () => {
		// Step 1 validation
		if (step === 1) {
			const { name, email, phone, password, confirmPassword } = customerDetails;

			if (
				!name ||
				!email ||
				!phone ||
				(!isAuthenticated() && (!password || !confirmPassword))
			) {
				toast.error("Please fill in all required fields.");
				return;
			}

			if (name.split(" ").length < 2) {
				toast.error("Please enter both first and last names.");
				return;
			}

			if (!/\S+@\S+\.\S+/.test(email)) {
				toast.error("Please enter a valid email address.");
				return;
			}

			if (!/^\d{10}$/.test(phone)) {
				toast.error("Please enter a valid 10-digit phone number.");
				return;
			}

			if (!isAuthenticated() && password !== confirmPassword) {
				setPasswordError("Passwords do not match");
				return;
			}

			setPasswordError("");

			ReactGA.event({
				category: "Checkout Page Customer Added Info",
				action: "Checkout Page Customer Added Info",
			});
		}

		// Step 2 validation
		if (step === 2) {
			if (
				!customerDetails.shipToName ||
				!address ||
				!city ||
				!state ||
				!/^\d{5}$/.test(zipcode) ||
				!shipmentChosen ||
				!shipmentChosen.carrierName
			) {
				if (!customerDetails.shipToName) {
					toast.error("Please enter the recipient's name.");
				} else if (!address) {
					toast.error("Please provide a valid address.");
				} else if (!city) {
					toast.error("Please provide a valid city.");
				} else if (!state) {
					toast.error("Please select your state.");
				} else if (!/^\d{5}$/.test(zipcode)) {
					toast.error("Please enter a valid 5-digit zipcode.");
				} else if (!shipmentChosen || !shipmentChosen.carrierName) {
					toast.error("Please choose a shipping option.");
				}
				return;
			}

			ReactGA.event({
				category: "Checkout Page Customer Added Shipping Details",
				action: "Checkout Page Customer Added Shipping Details",
			});
		}

		if (step === 3) {
			ReactGA.event({
				category: "Checkout Page Customer Reviewing Order",
				action: "Checkout Page Customer Reviewing Order",
			});
		}

		setStep(step + 1);
	};

	const handlePreviousStep = () => {
		setStep(step - 1);
	};

	// eslint-disable-next-line
	const handleProceedToCheckout = () => {
		if (
			!address ||
			!city ||
			!state ||
			!/^\d{5}$/.test(zipcode) ||
			!shipmentChosen ||
			!shipmentChosen.carrierName
		) {
			if (!address) {
				toast.error("Please provide a valid address.");
			} else if (!city) {
				toast.error("Please provide a valid city.");
			} else if (!state) {
				toast.error("Please select your state.");
			} else if (!/^\d{5}$/.test(zipcode)) {
				toast.error("Please enter a valid 5-digit zipcode.");
			} else if (!shipmentChosen || !shipmentChosen.carrierName) {
				toast.error("Please choose a shipping option.");
			}
			setStep(2);
			return;
		}

		if (!user) {
			const { name, email, phone, password, confirmPassword } = customerDetails;
			if (!name) {
				toast.error("Please enter your name.");
			} else if (!email) {
				toast.error("Please enter your email.");
			} else if (!phone) {
				toast.error("Please enter your phone number.");
			} else if (!password) {
				toast.error("Please enter your password.");
			} else if (!confirmPassword) {
				toast.error("Please confirm your password.");
			} else if (!/^\S+\s+\S+$/.test(name)) {
				toast.error("Please enter both first and last names.");
			} else if (!/\S+@\S+\.\S+/.test(email)) {
				toast.error("Please enter a valid email address.");
			} else if (!/^\d{10}$/.test(phone)) {
				toast.error("Please enter a valid 10-digit phone number.");
			} else if (password.length < 6) {
				toast.error("Password should be at least 6 characters long.");
			} else if (password !== confirmPassword) {
				toast.error("Passwords do not match.");
			} else if (!/\s/.test(address)) {
				toast.error("Please ensure that the address is correct.");
			} else {
				toast.error("Please complete all required fields.");
			}
			setStep(1);
			return;
		}

		setIsModalVisible(true);
	};

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);

		// eslint-disable-next-line
	}, [window.location.pathname]);

	return (
		<CartWrapper>
			<Helmet>
				<title>Checkout - Serene Jannat</title>
				<meta
					name='description'
					content='Complete your purchase at Serene Jannat. Review your cart, provide shipping details, and proceed to checkout for the best online shopping experience.'
				/>
				<meta
					name='keywords'
					content='Serene Jannat, checkout, cart, online shopping, shipping details, purchase, best gifts'
				/>
				<meta property='og:title' content='Checkout - Serene Jannat' />
				<meta
					property='og:description'
					content='Complete your purchase at Serene Jannat. Review your cart, provide shipping details, and proceed to checkout for the best online shopping experience.'
				/>
				<meta property='og:url' content='https://serenejannat.com/cart' />
				<link rel='canonical' href='https://serenejannat.com/cart' />
				<meta property='og:type' content='website' />
			</Helmet>
			{cart && cart.length === 0 ? (
				<div>
					<h3
						style={{
							textAlign: "center",
							marginTop: "20px",
							fontWeight: "bold",
						}}
					>
						Your Cart Is Empty...
					</h3>
				</div>
			) : (
				<>
					<StepIndicator>Step {step} of 3</StepIndicator>
					<Z1CartDetails
						appliedCoupon={appliedCoupon}
						goodCoupon={goodCoupon}
					/>
					<CouponWrapper>
						<div className='row'>
							<div className='col-md-6 my-auto'>
								<Input
									type='text'
									name='coupon'
									placeholder='Enter Coupon Code'
									value={coupon}
									onChange={(e) => setCoupon(e.target.value)}
								/>
							</div>

							<div className='col-md-6 mx-auto text-center my-auto'>
								<ApplyCouponButton onClick={handleApplyCoupon}>
									Apply Coupon
								</ApplyCouponButton>
							</div>
							{goodCoupon ? (
								<div
									style={{
										fontSize: "0.78rem",
										fontWeight: "bold",
										color: "darkgreen",
									}}
								>
									Congrats! You got {appliedCoupon && appliedCoupon.discount}%
									OFF of your purchase.
								</div>
							) : null}
						</div>
					</CouponWrapper>
					<StepTransition step={step}>
						<Z2StepOne
							step={step}
							customerDetails={customerDetails}
							handleCustomerDetailChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									[e.target.name]: e.target.value,
								})
							}
							handleNextStep={handleNextStep}
							passwordError={passwordError}
						/>
						<Z3StepTwo
							step={step}
							handleShippingOptionChange={(e) => {
								const chosenOption = allShippingOptions.find(
									(option) => option._id === e.target.value
								);
								addShipmentDetails(chosenOption);
							}}
							handleStateChange={(value) => setState(value)}
							handleAddressChange={(e) => setAddress(e.target.value)}
							handleCityChange={(e) => setCity(e.target.value)}
							allShippingOptions={allShippingOptions}
							handlePreviousStep={handlePreviousStep}
							handleNextStep={handleNextStep}
							state={state}
							address={address}
							city={city}
							setCity={setCity}
							comments={comments}
							handleCommentsChange={(e) => setComments(e.target.value)}
							shipmentChosen={shipmentChosen}
							zipcode={zipcode}
							handleZipCodeChange={(e) => setZipCode(e.target.value)}
							customerDetails={customerDetails} // Pass customerDetails
							handleCustomerDetailChange={(e) =>
								setCustomerDetails({
									...customerDetails,
									[e.target.name]: e.target.value,
								})
							}
						/>
						<Z4StepThree
							step={step}
							customerDetails={customerDetails}
							state={state}
							address={address}
							city={city}
							handlePreviousStep={handlePreviousStep}
							zipcode={zipcode}
							shipmentChosen={shipmentChosen}
							cart={cart}
							total_amount={total_amount}
							removeItem={(id, size, color) => removeItem(id, size, color)}
							user={user}
							setStep={setStep}
							comments={comments}
							coupon={coupon}
							appliedCoupon={appliedCoupon}
							goodCoupon={goodCoupon}
						/>
					</StepTransition>
				</>
			)}

			<Modal
				title='Thank You for Your Order!'
				open={isModalVisible}
				onOk={() => setIsModalVisible(false)}
				onCancel={() => setIsModalVisible(false)}
			>
				<p>
					Thank you for ordering. Your account has been created and you have
					been logged in.
				</p>
			</Modal>
		</CartWrapper>
	);
};

export default Cart;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const StepTransition = styled.div`
	${(props) =>
		props.step === 1
			? css`
					animation: ${fadeIn} 0.5s forwards;
				`
			: props.step === 2
				? css`
						animation: ${fadeIn} 0.5s forwards;
					`
				: css`
						animation: ${fadeIn} 0.5s forwards;
					`}
`;

const CartWrapper = styled.div`
	padding: 20px;
	max-width: 900px;
	margin: 100px auto;
	background-color: #ffffff;
	border-radius: 10px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	min-height: 1000px;
	overflow: hidden !important;

	@media (max-width: 768px) {
		padding: 10px;
		margin: 50px auto;
	}

	.ant-collapse-header-text {
		font-weight: bolder !important;
		font-size: 1rem;
	}
`;

const StepIndicator = styled.p`
	text-align: center;
	font-size: 1.2rem;
	font-weight: bold;
	margin-bottom: 20px;
`;

const CouponWrapper = styled.div`
	margin: 20px 0;
	display: flex;
	justify-content: center;
	input {
		width: 100%;
	}

	@media (max-width: 670px) {
		input {
			width: 100%;
		}
	}
`;

const Input = styled.input`
	padding: 10px;
	margin: 10px 0;
	border: 1px solid #ccc;
	border-radius: 5px;
	font-size: 1rem;
`;

const ApplyCouponButton = styled.button`
	padding: 5px 10px;
	background-color: #005f4e;
	color: white;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	&:hover {
		background-color: #00493e;
	}

	@media (max-width: 700px) {
		padding: 5px;
		font-size: 13px;
		width: 50%;
		text-align: center;
		margin: auto;
	}
`;
