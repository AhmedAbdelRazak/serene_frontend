import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaTrashAlt } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { Modal, Spin, Checkbox } from "antd";
import { toast } from "react-toastify";
import SquarePaymentForm from "./SquarePaymentForm";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

import {
	signup,
	signin,
	authenticate,
	isAuthenticated,
} from "../../auth/index";
import { createOrder } from "../../apiCore";
import { useCartContext } from "../../cart_context";
import axios from "axios";

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
	const { clearCart } = useCartContext();

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
				return toast.error("Please enter a valid 5-digit zipcode.");
			} else if (!shipmentChosen || !shipmentChosen.carrierName) {
				setStep(2);
				return toast.error("Please choose a shipping option.");
			}
		}

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
				return toast.error("First and Last names are required.");
			} else if (!/\S+@\S+\.\S+/.test(email)) {
				setStep(1);
				return toast.error("Please enter a valid email address.");
			} else if (!/^\d{10}$/.test(phone)) {
				setStep(1);
				return toast.error("Please enter a valid 10-digit phone number.");
			} else if (password.length < 6) {
				setStep(1);
				return toast.error("Password should be at least 6 characters long.");
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

	const handleSignupAndSignin = async () => {
		const { name, email, phone, password, confirmPassword } = customerDetails;

		if (!user) {
			if (!name) {
				toast.error("Please enter your name.");
				setStep(1);
				return false;
			}

			if (!email) {
				toast.error("Please enter your email.");
				setStep(1);
				return false;
			}

			if (!phone) {
				toast.error("Please enter your phone number.");
				setStep(1);
				return false;
			}

			if (!password) {
				toast.error("Please enter your password.");
				setStep(1);
				return false;
			}

			if (!confirmPassword) {
				toast.error("Please confirm your password.");
				setStep(1);
				return false;
			}

			if (name.trim().split(" ").length < 2) {
				toast.error("First and Last names are required.");
				setStep(1);
				return false;
			}

			if (!/\S+@\S+\.\S+/.test(email)) {
				toast.error("Please enter a valid email address.");
				setStep(1);
				return false;
			}

			if (!/^\d{10}$/.test(phone)) {
				toast.error("Please enter a valid 10-digit phone number.");
				setStep(1);
				return false;
			}

			if (password.length < 6) {
				toast.error("Password should be at least 6 characters long.");
				setStep(1);
				return false;
			}

			if (password !== confirmPassword) {
				toast.error("Passwords do not match.");
				setStep(1);
				return false;
			}

			try {
				const signinResponse = await signin({ emailOrPhone: email, password });

				if (signinResponse.error) {
					// If signin fails, proceed with signup
					const signupResponse = await signup({ name, email, password, phone });

					if (signupResponse.error) {
						toast.error(signupResponse.error);
						return false;
					}

					const newSigninResponse = await signin({
						emailOrPhone: email,
						password,
					});

					if (newSigninResponse.error) {
						toast.error(newSigninResponse.error);
						return false;
					}

					authenticate(newSigninResponse, () => {
						console.log("Successful");
					});
				} else {
					authenticate(signinResponse, () => {
						console.log("Successful");
					});
				}
			} catch (error) {
				console.error("Error during signup/signin:", error);
				toast.error("An error occurred during the signup/signin process.");
				return false;
			}
		}

		return true;
	};

	const totalAmountAdjusted = goodCoupon
		? (
				total_amount -
				Number(total_amount) * (appliedCoupon.discount / 100)
			).toFixed(2)
		: total_amount;

	const handlePayment = async (paymentToken) => {
		const token = isAuthenticated().token;
		const userId = isAuthenticated().user._id;

		// Prepare order data
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
				.map((item) => {
					const imageUrl =
						item.chosenProductAttributes?.productImages?.[0]?.url || "";
					return {
						productId: item._id,
						name: item.name,
						ordered_quantity: item.amount,
						price: item.priceAfterDiscount,
						image: imageUrl,
						chosenAttributes: item.chosenProductAttributes,
						isPrintifyProduct: item.isPrintifyProduct,
						printifyProductDetails: item.printifyProductDetails,
						customDesign: item.customDesign,
					};
				}),
			customerDetails: {
				name: customerDetails.name,
				email: customerDetails.email,
				phone: customerDetails.phone,
				address: address,
				city: city,
				state: state,
				zipcode: zipcode,
				userId: userId,
			},
			totalOrderQty: cart.reduce((sum, item) => sum + item.amount, 0),
			status: "In Process",
			onHoldStatus: "None",
			totalAmount: total_amount,
			totalAmountAfterDiscount: totalAmountAdjusted, // coupon logic
			chosenShippingOption: shipmentChosen,
			orderSource: "Website",
			appliedCoupon: goodCoupon ? appliedCoupon : {},
			shipDate: new Date(),
			orderCreationDate: new Date(),
			sendSMS: true,
			freeShipping: false,
			shippingFees:
				shipmentChosen && shipmentChosen.shippingPrice
					? shipmentChosen.shippingPrice
					: 10,
			paymentStatus: "In Process",
			orderComment: comments,
			privacyPolicyAgreement: isTermsAccepted,
		};

		try {
			const orderResponse = await createOrder(
				token,
				orderData,
				paymentToken,
				userId
			);

			if (orderResponse.error) {
				toast.error(orderResponse.error);
				setIsModalVisible(false);
			} else {
				// 1) Google Analytics event
				ReactGA.event({
					category: "User Successfully Paid",
					action: "User Successfully Paid",
				});

				// 2) Facebook Pixel - Purchase
				const eventId = `purchase-${Date.now()}`;
				ReactPixel.track(
					"Purchase",
					{
						currency: "USD",
						value: Number(totalAmountAdjusted), // e.g. 59.99
						contents: cart.map((item) => ({
							id: item._id,
							quantity: item.amount,
						})),
						content_type: "product",
					},
					{
						eventID: eventId,
					}
				);

				// 3) Server-Side Conversions API
				//    For potential deduplication, use the same eventId
				axios
					.post(
						`${process.env.REACT_APP_API_URL}/facebookpixel/conversionapi`,
						{
							eventName: "Purchase",
							eventId,
							email: customerDetails.email || null,
							phone: customerDetails.phone || null,
							currency: "USD",
							value: Number(totalAmountAdjusted),
							contentIds: cart.map((item) => item._id),
							userAgent: window.navigator.userAgent,
							// omit clientIpAddress so the server infers from req.ip
						}
					)
					.catch((err) => {
						console.error("Server-side Purchase event error:", err);
					});

				toast.success("Order successfully created.");

				// 4) Google Ads conversion tracking if gtag is available
				if (window.gtag) {
					const orderValue = Number(totalAmountAdjusted);
					const orderId = orderResponse?.order?._id || "some-fallback-id";

					window.gtag("event", "conversion", {
						send_to: "AW-11537568049/k1aMCO6fgIAaELGixf0q",
						value: orderValue,
						currency: "USD",
						transaction_id: orderId,
					});
				}

				// 5) Clear cart & redirect after short delay
				setTimeout(() => {
					clearCart();
					setIsLoading(false);
					window.location.href = "/dashboard";
				}, 3000);
			}
		} catch (error) {
			setIsLoading(false);
			toast.error("Error creating order.");
			console.error("Error creating order:", error);
			setIsModalVisible(false);
		}
	};

	const handlePaymentSuccess = async (paymentToken) => {
		const isSignupSigninSuccessful = await handleSignupAndSignin();

		if (isSignupSigninSuccessful) {
			await handlePayment(paymentToken);
		} else {
			console.log("Signup/Signin failed, payment not processed.");
		}
	};

	return (
		<>
			{step === 3 && (
				<Step>
					<StepTitle>Review</StepTitle>
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
							<strong>Shipping Price:</strong> $
							{shipmentChosen && shipmentChosen.shippingPrice}
						</ReviewItem>
					</ReviewDetails>
					<CartItems>
						{cart.map((item, i) => (
							<CartItem key={i}>
								<ItemImage src={item.image} alt={item.name} />
								<ItemDetails>
									<ItemName className='p-0 m-0'>Product: {item.name}</ItemName>
									<ItemQuantity className='p-0 m-0'>
										Quantity: {item.amount}
									</ItemQuantity>
									<ItemPrice className='p-0 m-0'>
										Price/ Unit: ${item.priceAfterDiscount}
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
					<TotalAmount>
						{goodCoupon ? (
							<>
								<DiscountedTotal>
									Total Amount:{" "}
									<s style={{ color: "red" }}>
										${Number(total_amount).toFixed(2)}
									</s>
									<DiscountedPrice>${totalAmountAdjusted}</DiscountedPrice>
								</DiscountedTotal>
							</>
						) : (
							`Total Amount: $${Number(total_amount).toFixed(2)}`
						)}
						<hr className='col-md-6' />
					</TotalAmount>
					<ButtonWrapper>
						<BackButton onClick={handlePreviousStep}>Back</BackButton>
						<CheckoutButton onClick={handleProceedToCheckout}>
							Proceed to Checkout
						</CheckoutButton>
						<ClearCartButton onClick={() => history.push("/our-products")}>
							Continue Shopping...
						</ClearCartButton>
					</ButtonWrapper>
					<Modal
						title='Enter Your Payment Details'
						open={isModalVisible}
						onCancel={() => setIsModalVisible(false)}
						footer={null}
					>
						{isLoading ? (
							<Spin />
						) : (
							<>
								{isTermsAccepted ? (
									<SquarePaymentForm
										amount={totalAmountAdjusted} // Adjust amount
										currency='USD'
										handlePaymentSuccess={handlePaymentSuccess}
										zipCode={zipcode} // Pass the ZIP code to the payment form
										onError={() => setIsModalVisible(false)} // Pass onError function
										isTermsAccepted={isTermsAccepted}
									/>
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
	margin-bottom: 5px;
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
