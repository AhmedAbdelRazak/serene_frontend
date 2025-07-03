/* ------------------------------------------------------------------
   Z4StepThree – Order review & Stripe Checkout redirect
   ------------------------------------------------------------------ */

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaTrashAlt } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { Modal, Spin, Checkbox } from "antd";
import { toast } from "react-toastify";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
import axios from "axios";

import { signup, signin, authenticate, isAuthenticated } from "../../auth";
import { createStripeCheckoutSession } from "../../apiCore"; // <— NEW helper
// import { useCartContext } from "../../cart_context";

/* ────────────────────────────────────────────────────────────────── */

const Z4StepThree = ({
	step,
	customerDetails,
	state,
	address,
	city,
	handlePreviousStep,
	zipcode,
	shipmentChosen,
	cart,
	total_amount,
	removeItem,
	user,
	setStep,
	comments,
	appliedCoupon,
	goodCoupon,
}) => {
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isTermsAccepted, setIsTermsAccepted] = useState(false);

	const history = useHistory();

	/* ───── helpers ───── */

	/** Validate form & open modal */
	const handleProceedToCheckout = () => {
		// ---------- address validation ----------
		if (
			!address ||
			!city ||
			!state ||
			!/^\d{5}$/.test(zipcode) ||
			!shipmentChosen ||
			!shipmentChosen.carrierName
		) {
			if (!address) {
				setStep(2);
				return toast.error("Please provide a valid address.");
			} else if (!city) {
				setStep(2);
				return toast.error("Please provide your city.");
			} else if (!state) {
				setStep(2);
				return toast.error("Please select your state.");
			} else if (!/^\d{5}$/.test(zipcode)) {
				setStep(2);
				return toast.error("Please enter a valid 5‑digit zipcode.");
			} else if (!shipmentChosen || !shipmentChosen.carrierName) {
				setStep(2);
				return toast.error("Please choose a shipping option.");
			}
		}

		// ---------- customer validation for guests ----------
		if (!user) {
			const { name, email, phone, password, confirmPassword } = customerDetails;
			if (!name) {
				setStep(1);
				return toast.error("Please enter your name.");
			} else if (!email) {
				setStep(1);
				return toast.error("Please enter your email.");
			} else if (!phone) {
				setStep(1);
				return toast.error("Please enter your phone number.");
			} else if (!password) {
				setStep(1);
				return toast.error("Please enter your password.");
			} else if (!confirmPassword) {
				setStep(1);
				return toast.error("Please confirm your password.");
			} else if (name.trim().split(" ").length < 2) {
				setStep(1);
				return toast.error("First and last names are required.");
			} else if (!/\S+@\S+\.\S+/.test(email)) {
				setStep(1);
				return toast.error("Please enter a valid email address.");
			} else if (!/^\d{10}$/.test(phone)) {
				setStep(1);
				return toast.error("Please enter a valid 10‑digit phone number.");
			} else if (password.length < 6) {
				setStep(1);
				return toast.error("Password should be at least 6 characters.");
			} else if (password !== confirmPassword) {
				setStep(1);
				return toast.error("Passwords do not match.");
			} else if (!/\s/.test(address)) {
				setStep(2);
				return toast.error("Please ensure that the address is correct.");
			}
		}

		setIsModalVisible(true);
	};

	/** Handle guest signup / signin (unchanged logic) */
	const handleSignupAndSignin = async () => {
		if (user) return true; // logged‑in users skip

		const { name, email, phone, password } = customerDetails;
		try {
			// attempt signin first
			const signInResp = await signin({ emailOrPhone: email, password });
			if (signInResp.error) {
				// create account then sign in
				const signUpResp = await signup({ name, email, password, phone });
				if (signUpResp.error) {
					toast.error(signUpResp.error);
					return false;
				}
				const secondSignin = await signin({ emailOrPhone: email, password });
				if (secondSignin.error) {
					toast.error(secondSignin.error);
					return false;
				}
				authenticate(secondSignin, () => {});
			} else {
				authenticate(signInResp, () => {});
			}
			return true;
		} catch (err) {
			console.error("Signup/Signin error:", err);
			toast.error("Unable to create or log in to your account.");
			return false;
		}
	};

	/** Coupon‑adjusted total */
	const totalAmountAdjusted = goodCoupon
		? (
				total_amount -
				Number(total_amount) * (appliedCoupon.discount / 100)
			).toFixed(2)
		: total_amount;

	/** =============  Stripe Checkout redirect  ============= */
	const startStripeCheckout = async () => {
		try {
			const signupOk = await handleSignupAndSignin();
			if (!signupOk) return;

			setIsLoading(true);

			const { token, user: authUser } = isAuthenticated();
			const userId = authUser?._id;

			/* -------- assemble orderData identical to backend needs -------- */
			const orderData = {
				productsNoVariable: cart
					.filter((item) => !item.chosenProductAttributes)
					.map((item) => ({
						productId: item._id,
						name: item.name,
						ordered_quantity: item.amount,
						price: item.priceAfterDiscount,
						image: item.image,
						isPrintifyProduct: item.isPrintifyProduct,
						printifyProductDetails: item.printifyProductDetails,
						customDesign: item.customDesign,
						storeId: item.storeId,
					})),
				chosenProductQtyWithVariables: cart
					.filter((item) => item.chosenProductAttributes)
					.map((item) => ({
						productId: item._id,
						name: item.name,
						ordered_quantity: item.amount,
						price: item.priceAfterDiscount,
						image: item.chosenProductAttributes?.productImages?.[0]?.url || "",
						chosenAttributes: item.chosenProductAttributes,
						isPrintifyProduct: item.isPrintifyProduct,
						printifyProductDetails: item.printifyProductDetails,
						customDesign: item.customDesign,
					})),
				customerDetails: {
					name: customerDetails.name,
					email: customerDetails.email,
					phone: customerDetails.phone,
					address,
					city,
					state,
					zipcode,
					userId,
				},
				totalOrderQty: cart.reduce((sum, i) => sum + i.amount, 0),
				status: "Awaiting Payment",
				onHoldStatus: "None",
				totalAmount: total_amount,
				totalAmountAfterDiscount: totalAmountAdjusted,
				chosenShippingOption: shipmentChosen,
				orderSource: "Website",
				appliedCoupon: goodCoupon ? appliedCoupon : {},
				shipDate: new Date(),
				orderCreationDate: new Date(),
				sendSMS: true,
				freeShipping: false,
				shippingFees: shipmentChosen?.shippingPrice || 10,
				paymentStatus: "Pending",
				orderComment: comments,
				privacyPolicyAgreement: isTermsAccepted,
			};
			/* --------------------------------------------------------------- */

			// ---- analytics before redirect ----
			ReactGA.event({
				category: "Stripe Checkout",
				action: "Redirect to Stripe",
			});
			const fbEventId = `checkout-${Date.now()}`;
			ReactPixel.track(
				"InitiateCheckout",
				{
					currency: "USD",
					value: Number(totalAmountAdjusted),
					num_items: cart.length,
					content_type: "product",
					contents: cart.map((i) => ({ id: i._id, quantity: i.amount })),
				},
				{ eventID: fbEventId }
			);
			// server‑side deduplication hit
			axios
				.post(`${process.env.REACT_APP_API_URL}/facebookpixel/conversionapi`, {
					eventName: "InitiateCheckout",
					eventId: fbEventId,
					email: customerDetails.email || null,
					phone: customerDetails.phone || null,
					currency: "USD",
					value: Number(totalAmountAdjusted),
					contentIds: cart.map((i) => i._id),
					userAgent: window.navigator.userAgent,
				})
				.catch(() => {
					/* ignore */
				});

			// ---- talk to backend ----
			const resp = await createStripeCheckoutSession(token, orderData);
			if (resp.error || !resp.url) {
				throw new Error(resp.error || "Server did not return checkout URL");
			}

			window.location.href = resp.url; // off to Stripe
		} catch (err) {
			console.error("Stripe checkout error:", err);
			toast.error("Unable to start payment. Please try again.");
			setIsLoading(false);
		}
	};
	/* ================================================================ */

	return (
		<>
			{step === 3 && (
				<Step>
					<StepTitle>Review</StepTitle>

					{/* ========== customer / shipping summary ========== */}
					<ReviewDetails>
						<ReviewItem>
							<strong>Name:</strong> {customerDetails.name}
						</ReviewItem>
						<ReviewItem>
							<strong>Phone:</strong> {customerDetails.phone}
						</ReviewItem>
						<ReviewItem>
							<strong>Ship to State:</strong> {state}
						</ReviewItem>
						<ReviewItem>
							<strong>Ship to Address:</strong> {address}
						</ReviewItem>
						<ReviewItem>
							<strong>Ship to City:</strong> {city}
						</ReviewItem>
						<ReviewItem>
							<strong>Zipcode:</strong> {zipcode}
						</ReviewItem>
						<ReviewItem>
							<strong>Shipping Price:</strong> ${shipmentChosen?.shippingPrice}
						</ReviewItem>
					</ReviewDetails>

					{/* ========== cart list ========== */}
					<CartItems>
						{cart.map((item, i) => (
							<CartItem key={i}>
								<ItemImage src={item.image} alt={item.name} />
								<ItemDetails>
									<ItemName>Product: {item.name}</ItemName>
									<ItemQuantity>Quantity: {item.amount}</ItemQuantity>
									<ItemPrice>
										Price / unit: ${item.priceAfterDiscount}
									</ItemPrice>
									<RemoveButton
										onClick={() => removeItem(item.id, item.size, item.color)}
									>
										<FaTrashAlt />
									</RemoveButton>
								</ItemDetails>
							</CartItem>
						))}
					</CartItems>

					{/* ========== totals ========== */}
					<TotalAmount>
						{goodCoupon ? (
							<DiscountedTotal>
								Total Amount:&nbsp;
								<s style={{ color: "red" }}>
									${Number(total_amount).toFixed(2)}
								</s>
								<DiscountedPrice>${totalAmountAdjusted}</DiscountedPrice>
							</DiscountedTotal>
						) : (
							`Total Amount: $${Number(total_amount).toFixed(2)}`
						)}
						<hr className='col-md-6' />
					</TotalAmount>

					{/* ========== action buttons ========== */}
					<ButtonWrapper>
						<BackButton onClick={handlePreviousStep}>Back</BackButton>
						<CheckoutButton onClick={handleProceedToCheckout}>
							Proceed to Checkout
						</CheckoutButton>
						<ClearCartButton onClick={() => history.push("/our-products")}>
							Continue Shopping…
						</ClearCartButton>
					</ButtonWrapper>

					{/* ========== modal ========== */}
					<Modal
						title='Confirm & Pay Securely'
						open={isModalVisible}
						onCancel={() => setIsModalVisible(false)}
						footer={null}
					>
						{isLoading ? (
							<Spin />
						) : (
							<>
								{isTermsAccepted ? (
									<PayNowButton onClick={startStripeCheckout}>
										Pay with Card — Secure Stripe Checkout
									</PayNowButton>
								) : (
									<TermsWrapper>
										<Checkbox
											checked={isTermsAccepted}
											onChange={(e) => {
												ReactGA.event({
													category: "User Accepted Terms And Conditions",
													action: "User Accepted Terms And Conditions",
												});
												setIsTermsAccepted(e.target.checked);
											}}
										>
											I agree to the terms and conditions
										</Checkbox>
										<TermsLink
											href='/privacy-policy-terms-conditions'
											target='_blank'
										>
											Click here to read our terms and conditions
										</TermsLink>
									</TermsWrapper>
								)}
							</>
						)}
					</Modal>
				</Step>
			)}
		</>
	);
};

export default Z4StepThree;

/* ───────────────────────────── styled components ─────────────────────────── */

const fadeIn = keyframes`
  from { opacity:0; transform:translateX(100%);} 
  to   { opacity:1; transform:translateX(0);}
`;

const Step = styled.div`
	display: flex;
	flex-direction: column;
	animation: ${fadeIn} 0.5s forwards;
`;

const StepTitle = styled.h2`
	text-align: center;
	margin-bottom: 20px;
	font-weight: bold;
	font-size: 1.2rem;
	border-bottom: 3px solid #ccc;
	width: 25%;
	margin-left: auto;
	margin-right: auto;
	padding-bottom: 5px;

	@media (max-width: 790px) {
		width: 80%;
	}
`;

/* ===== list & item styles ===== */
const CartItems = styled.div`
	margin-top: 20px;
`;
const CartItem = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	border-bottom: 1px solid #ccc;
	padding-bottom: 15px;
`;
const ItemImage = styled.img`
	width: 80px;
	height: 80px;
	object-fit: cover;
	border-radius: 8px;
	margin-right: 15px;
`;
const ItemDetails = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	position: relative;
`;
const ItemName = styled.p`
	font-weight: bold;
	margin: 0 0 5px;
	text-transform: capitalize;
	font-size: 0.9rem;
`;
const ItemQuantity = styled.p`
	margin: 0 10px;
	font-size: 0.9rem;
	font-weight: bold;
`;
const ItemPrice = styled.p`
	font-weight: bold;
	color: #0c1d2d;
	font-size: 0.9rem;
`;
const RemoveButton = styled.button`
	position: absolute;
	right: 0;
	top: 0;
	background: none;
	border: none;
	color: red;
	font-size: 18px;
	cursor: pointer;
	&:hover {
		color: darkred;
	}
`;

const TotalAmount = styled.div`
	margin-top: 20px;
	font-size: 1.2rem;
	font-weight: bold;
	color: #0c1d2d;
	text-align: center;
`;

const ButtonWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	margin-top: 20px;
	@media (max-width: 768px) {
		flex-direction: column;
		align-items: center;
	}
`;
const BackButton = styled.button`
	padding: 10px 20px;
	background: #ddd;
	color: black;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	border-radius: 5px;
	width: 25%;
	cursor: pointer;
	&:hover {
		background: #ccc;
	}
	@media (max-width: 768px) {
		width: 100%;
		margin-bottom: 10px;
	}
`;
const CheckoutButton = styled.button`
	padding: 10px 20px;
	background: black;
	color: white;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	width: 25%;
	border-radius: 5px;
	cursor: pointer;
	&:hover {
		background: #005f4e;
	}
	@media (max-width: 768px) {
		width: 100%;
		margin-bottom: 10px;
	}
`;
const ClearCartButton = styled.button`
	padding: 10px 20px;
	background: #4c1414;
	color: white;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	width: 25%;
	border-radius: 5px;
	cursor: pointer;
	&:hover {
		background: darkred;
	}
	@media (max-width: 768px) {
		width: 100%;
	}
`;

const ReviewDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 20px;
	strong {
		font-weight: bold;
	}
`;
const ReviewItem = styled.p`
	font-size: 1rem;
	color: #333;
`;

const TermsWrapper = styled.div`
	margin-top: 20px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`;
const TermsLink = styled.a`
	color: var(--primary-color);
	text-decoration: underline;
	margin-top: 10px;
	cursor: pointer;
	&:hover {
		color: var(--primary-color-dark);
	}
`;

const DiscountedTotal = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 1.2rem;
	font-weight: bold;
	color: #0c1d2d;
`;
const DiscountedPrice = styled.span`
	margin-left: 10px;
	font-weight: bold;
`;

const PayNowButton = styled.button`
	padding: 10px 20px;
	background: var(--button-bg-primary, #25a26f);
	color: white;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	width: 100%;
	border-radius: 5px;
	cursor: pointer;
	margin-top: 15px;
	&:hover {
		background: #14885c;
	}
`;
