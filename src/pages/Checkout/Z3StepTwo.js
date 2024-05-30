import React from "react";
import styled, { keyframes } from "styled-components";
import { Select } from "antd";
import { states } from "../../Global";

const { Option } = Select;

const Z3StepTwo = ({
	step,
	handleShippingOptionChange,
	handleStateChange,
	handleAddressChange,
	allShippingOptions,
	handlePreviousStep,
	handleNextStep,
	state,
	address,
	comments,
	handleCommentsChange,
	shipmentChosen,
	zipcode,
	handleZipCodeChange,
}) => {
	return (
		<>
			{step === 2 && (
				<Step>
					<StepTitle>Shipping Options</StepTitle>
					<ShippingOption>
						<label className='mb-0 mt-3'>Choose State</label>
						<Select
							placeholder='Select a state'
							value={state}
							onChange={handleStateChange}
							style={{ width: "100%" }}
						>
							{states.map((state, i) => (
								<Option key={i} value={state.name}>
									{state.name}
								</Option>
							))}
						</Select>
					</ShippingOption>
					<ShippingOptionRow>
						<div className='row'>
							<div className='col-md-10'>
								<ShippingOption>
									<label className='mb-0 mt-3'>Ship To Address</label>
									<Input
										type='text'
										name='address'
										placeholder='Enter shipping address'
										value={address}
										onChange={handleAddressChange}
									/>
								</ShippingOption>
							</div>
							<div className='col-md-2'>
								<ShippingOption>
									<label className='mb-0 mt-3'>Zip Code</label>
									<Input
										type='text'
										className='w-100'
										name='zipcode'
										placeholder='Enter zip code'
										value={zipcode}
										onChange={handleZipCodeChange}
										width='15%' // Ensure zip code takes 15%
									/>
								</ShippingOption>
							</div>
						</div>
					</ShippingOptionRow>
					<ShippingOption>
						<label className='mb-0 mt-3'>Comments</label>
						<TextArea
							rows={4}
							placeholder='Enter any additional comments'
							value={comments}
							onChange={handleCommentsChange}
						/>
					</ShippingOption>
					<>
						<label className='mt-3'>Choose a carrier</label>
					</>
					{allShippingOptions &&
						allShippingOptions.map((option) => (
							<ShippingOption key={option._id}>
								<ShippingLabel>
									<input
										type='radio'
										name='shippingOption'
										value={option._id}
										checked={shipmentChosen._id === option._id}
										onChange={handleShippingOptionChange}
									/>
									{option.carrierName} - ${option.shippingPrice}
								</ShippingLabel>
							</ShippingOption>
						))}
					<ButtonWrapper>
						<BackButton onClick={handlePreviousStep}>Back</BackButton>
						<ContinueButton onClick={handleNextStep}>Continue</ContinueButton>
					</ButtonWrapper>
				</Step>
			)}
		</>
	);
};

export default Z3StepTwo;

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
	width: ${(props) => props.width || "100%"};
`;

const TextArea = styled.textarea`
	padding: 10px;
	margin: 10px 0;
	border: 1px solid #ccc;
	border-radius: 5px;
	font-size: 1rem;
	width: 100%;
`;

const ShippingOption = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	margin-bottom: 10px;

	.zipcodeInput {
		width: 20% !important;
	}

	.zipcodeAddress {
		width: 85% !important;
	}

	input {
		margin-right: 10px;
	}

	label {
		font-size: 1rem;
	}
`;

const ShippingOptionRow = styled.div`
	display: flex;
	width: 100%;
	align-items: center;

	& > div {
		flex: 1;
	}
`;

const ShippingLabel = styled.label`
	font-size: 1rem;
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
