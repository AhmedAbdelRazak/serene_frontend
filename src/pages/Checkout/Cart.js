import React, { useState, useEffect } from "react";
import styled, { css, keyframes } from "styled-components";
import { useCartContext } from "../../cart_context";
import { getShippingOptions } from "../../apiCore";
import Z1CartDetails from "./Z1CartDetails";
import Z2StepOne from "./Z2StepOne";
import Z3StepTwo from "./Z3StepTwo";
import Z4StepThree from "./Z4StepThree";
import { useHistory } from "react-router-dom";
import { isAuthenticated } from "../../auth";
import { Modal } from "antd";

const Cart = () => {
	const { cart, total_amount, addShipmentDetails, shipmentChosen, removeItem } =
		useCartContext();
	const [step, setStep] = useState(1);
	const [customerDetails, setCustomerDetails] = useState({
		name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [passwordError, setPasswordError] = useState("");
	const [allShippingOptions, setAllShippingOptions] = useState([]);
	const [coupon, setCoupon] = useState("");
	const [state, setState] = useState("");
	const [address, setAddress] = useState("");
	const [zipcode, setZipCode] = useState("");
	const [comments, setComments] = useState("");
	const [isModalVisible, setIsModalVisible] = useState(false);
	// eslint-disable-next-line
	const history = useHistory();
	const { user } = isAuthenticated();

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
		if (
			step === 1 &&
			customerDetails.password !== customerDetails.confirmPassword
		) {
			setPasswordError("Passwords do not match");
		} else {
			setStep(step + 1);
		}
	};

	const handlePreviousStep = () => {
		setStep(step - 1);
	};

	return (
		<CartWrapper>
			<StepIndicator>Step {step} of 3</StepIndicator>
			<Z1CartDetails />
			<CouponWrapper>
				<Input
					type='text'
					name='coupon'
					placeholder='Enter Coupon Code'
					value={coupon}
					onChange={(e) => setCoupon(e.target.value)}
				/>
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
					allShippingOptions={allShippingOptions}
					handlePreviousStep={handlePreviousStep}
					handleNextStep={handleNextStep}
					state={state}
					address={address}
					comments={comments}
					handleCommentsChange={(e) => setComments(e.target.value)}
					shipmentChosen={shipmentChosen}
					zipcode={zipcode}
					handleZipCodeChange={(e) => setZipCode(e.target.value)}
				/>
				<Z4StepThree
					step={step}
					customerDetails={customerDetails}
					state={state}
					address={address}
					// handleCheckout={handleCheckout}
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
				/>
			</StepTransition>
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
		width: 50%;
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
