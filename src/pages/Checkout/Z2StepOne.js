import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { isAuthenticated } from "../../auth";

const Z2StepOne = ({
	step,
	customerDetails,
	handleCustomerDetailChange,
	handleNextStep,
	passwordError,
}) => {
	const [errors, setErrors] = useState({
		name: false,
		email: false,
		phone: false,
		password: false,
		confirmPassword: false,
	});

	return (
		<>
			{step === 1 && (
				<Step>
					<StepTitle>Customer Details</StepTitle>
					<Input
						type='text'
						name='name'
						placeholder='Name'
						value={customerDetails.name}
						onChange={handleCustomerDetailChange}
						className={errors.name ? "error" : ""}
					/>
					<Input
						type='email'
						name='email'
						placeholder='Email'
						value={customerDetails.email}
						onChange={handleCustomerDetailChange}
						className={errors.email ? "error" : ""}
					/>
					<Input
						type='tel'
						name='phone'
						placeholder='Phone'
						value={customerDetails.phone}
						onChange={handleCustomerDetailChange}
						className={errors.phone ? "error" : ""}
					/>
					{isAuthenticated() &&
					isAuthenticated().user &&
					isAuthenticated().user.name ? null : (
						<PasswordWrapper>
							<Input
								className={`w-50 ${errors.password ? "error" : ""}`}
								type='password'
								name='password'
								placeholder='Password'
								value={customerDetails.password}
								onChange={handleCustomerDetailChange}
							/>
							<Input
								className={`w-50 ${errors.confirmPassword ? "error" : ""}`}
								type='password'
								name='confirmPassword'
								placeholder='Confirm Password'
								value={customerDetails.confirmPassword}
								onChange={handleCustomerDetailChange}
							/>
						</PasswordWrapper>
					)}

					{passwordError && <Error>{passwordError}</Error>}
					<ButtonWrapper>
						<ContinueButton onClick={() => handleNextStep(errors, setErrors)}>
							Continue
						</ContinueButton>
					</ButtonWrapper>
				</Step>
			)}
		</>
	);
};

export default Z2StepOne;

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

const Input = styled.input`
	padding: 10px;
	margin: 10px 0;
	border: 1px solid #ccc;
	border-radius: 5px;
	font-size: 1rem;

	&.error {
		border-color: #ff6b6b; // Light reddish color for error
	}
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

const ContinueButton = styled.button`
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

const PasswordWrapper = styled.div`
	display: flex;
	justify-content: space-between;
	width: 100% !important;
	gap: 10px;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const Error = styled.p`
	color: red;
	font-size: 0.9rem;
	text-align: center;
`;
