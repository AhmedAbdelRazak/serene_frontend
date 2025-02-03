import React from "react";
import styled, { keyframes } from "styled-components";
import { Select } from "antd";
import { states } from "../../Global";
import { useCartContext } from "../../cart_context"; // <-- import cart context to access cart

const { Option } = Select;

const Z3StepTwo = ({
	step,
	handleShippingOptionChange, // We'll keep it, though we're using our own handler
	handleStateChange,
	handleAddressChange,
	handleCityChange,
	allShippingOptions,
	handlePreviousStep,
	handleNextStep,
	state,
	address,
	city,
	comments,
	handleCommentsChange,
	shipmentChosen,
	zipcode,
	handleZipCodeChange,
	customerDetails,
	handleCustomerDetailChange,
}) => {
	const { cart, addShipmentDetails } = useCartContext();

	// 1) We detect whether there's at least one Printify product in the cart:
	const hasPrintifyItem = cart.some((item) => item.isPrintifyProduct);

	// 2) We also check specifically for a Printify POD product with a custom design:
	const hasCustomDesignPOD = cart.some(
		(item) => item.isPrintifyProduct && item.customDesign
	);

	// 3) Helper to compute shipping cost
	const getFinalShippingCost = (option) => {
		const personalStockCount = cart.filter(
			(item) => !item.isPrintifyProduct
		).length;
		const printifyCount = cart.filter((item) => item.isPrintifyProduct).length;

		let finalPrice = 0;
		// If there's at least one personal-stock item, start with option.shippingPrice
		if (personalStockCount > 0) {
			finalPrice += option.shippingPrice;
			// Add $3 for each additional personal-stock item beyond the first
			if (personalStockCount > 1) {
				finalPrice += (personalStockCount - 1) * 3;
			}
		}
		// For Printify items, add $4 for each
		finalPrice += printifyCount * 4;

		return finalPrice;
	};

	// 4) Called when user picks a shipping option radio
	const handleLocalShippingOptionChange = (optionId) => {
		const chosenOption = allShippingOptions.find((opt) => opt._id === optionId);
		if (!chosenOption) return;

		const finalShippingPrice = getFinalShippingCost(chosenOption);
		const finalChosenOption = {
			...chosenOption,
			shippingPrice: finalShippingPrice,
		};
		addShipmentDetails(finalChosenOption);
	};

	// 5) Local shipping checks
	const closeCities = [
		"San Bernardino",
		"Riverside",
		"Redlands",
		"Ontario",
		"Fontana",
		"Rancho Cucamonga",
		"Colton",
		"Loma Linda",
		"Highland",
		"Hesperia",
		"Moreno Valley",
		"Crestline",
		"Twin Peaks",
		"Big Bear",
		"Blue Jay",
		"Inland Empire",
		"Anaheim",
		"Orange County",
		"Banning",
		"Redlands",
		"Upland",
		"Chino",
		"Montclair",
	];

	const isLocalShipping = shipmentChosen._id === "66c2a28f9a509e5920162709";
	const isStateCalifornia = state.toLowerCase() === "california";
	const isCityNotInCloseCities = !closeCities.some((closeCity) =>
		city.toLowerCase().includes(closeCity.toLowerCase())
	);

	// 6) Filter out undesired shipping options
	//    - If user is NOT in California, exclude local shipping IDs
	//    - If there is at least one Printify item, exclude these same local shipping IDs
	const filteredShippingOptions = allShippingOptions.filter((option) => {
		// If not CA
		if (!isStateCalifornia) {
			if (
				option._id === "66c2a28f9a509e5920162709" || // local pickup
				option._id === "66c2a2379a509e59201626da" // local delivery
			) {
				return false;
			}
		}

		// If there's a Printify item in the cart, also exclude pickup & local
		if (hasPrintifyItem) {
			if (
				option._id === "66c2a28f9a509e5920162709" ||
				option._id === "66c2a2379a509e59201626da"
			) {
				return false;
			}
		}

		return true;
	});

	return (
		<>
			{step === 2 && (
				<Step>
					<StepTitle>Shipping Options</StepTitle>
					<ShippingOption>
						<label className='mb-0 mt-3'>Ship To Name</label>
						<Input
							type='text'
							name='shipToName'
							placeholder='Enter recipient name'
							value={customerDetails.shipToName}
							onChange={handleCustomerDetailChange}
						/>
					</ShippingOption>
					<ShippingOption>
						<label className='mb-0 mt-3'>Ship To State</label>
						<Select
							placeholder='Select a state'
							value={state}
							onChange={handleStateChange}
							style={{ width: "100%" }}
						>
							{states.map((st, i) => (
								<Option key={i} value={st.name}>
									{st.name}
								</Option>
							))}
						</Select>
					</ShippingOption>
					<ShippingOptionRow>
						<ShippingOptionWrapper>
							<label className='mb-0 mt-3'>Ship To Address</label>
							<Input
								type='text'
								name='address'
								placeholder='Enter shipping address'
								value={address}
								onChange={handleAddressChange}
							/>
						</ShippingOptionWrapper>
						<ShippingOptionWrapper>
							<label className='mb-0 mt-3'>Ship To City</label>
							<Input
								type='text'
								name='city'
								placeholder='Enter city'
								value={city}
								onChange={handleCityChange}
							/>
						</ShippingOptionWrapper>
						<ShippingOptionWrapper>
							<label className='mb-0 mt-3'>Zip Code</label>
							<Input
								type='text'
								name='zipcode'
								placeholder='Enter zip code'
								value={zipcode}
								onChange={handleZipCodeChange}
							/>
						</ShippingOptionWrapper>
					</ShippingOptionRow>
					<ShippingOption>
						<label
							className='mb-0 mt-3'
							style={{ fontWeight: "bold", fontSize: "1.1rem" }}
						>
							Comments
						</label>
						<div className='commentNote'>
							Add special instructions here such as requesting a handwritten
							card for a special occasion or any other details we would need to
							know to best fulfill your order
							<br />
							<span className='noteMessage'>
								Please note: We currently do not offer cards for candle and
								t-shirt shipments.
							</span>
						</div>
						<TextArea
							rows={4}
							placeholder='Enter any additional comments'
							value={comments}
							onChange={handleCommentsChange}
						/>
					</ShippingOption>

					{/* 7) Show the Printify POD note if there is a product with custom design */}
					{hasCustomDesignPOD && (
						<PODNote>
							Your custom-designed item requires extra production time. Please
							note that it can take up to <strong>10 days</strong> for Print on
							Demand (POD) items to be produced and shipped. We appreciate your
							patience and look forward to delivering your unique creation!
						</PODNote>
					)}

					<>
						<label
							className='mt-3'
							style={{ fontWeight: "bold", fontSize: "1.2rem" }}
						>
							Choose a carrier
						</label>
					</>
					{filteredShippingOptions.map((option) => {
						const finalShippingCost = getFinalShippingCost(option);
						return (
							<ShippingOption key={option._id}>
								<ShippingLabel>
									<input
										type='radio'
										name='shippingOption'
										value={option._id}
										checked={shipmentChosen._id === option._id}
										onChange={() => handleLocalShippingOptionChange(option._id)}
									/>
									{option.carrierName} - ${finalShippingCost}
								</ShippingLabel>
							</ShippingOption>
						);
					})}
					{isLocalShipping && isStateCalifornia && isCityNotInCloseCities && (
						<WarningMessage>
							Please ensure that you choose the correct shipping option, we are
							only shipping to the cities {closeCities.join(", ")}.
						</WarningMessage>
					)}
					<ButtonWrapper>
						<BackButton onClick={handlePreviousStep}>Back</BackButton>
						<ContinueButton
							onClick={handleNextStep}
							disabled={
								!customerDetails.shipToName ||
								!address ||
								!city ||
								!state ||
								!/^\d{5}$/.test(zipcode) ||
								!shipmentChosen ||
								!shipmentChosen.carrierName
							}
						>
							Continue
						</ContinueButton>
					</ButtonWrapper>
				</Step>
			)}
		</>
	);
};

export default Z3StepTwo;

// -------------------------- STYLES --------------------------------

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
	width: 100%;
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

	.noteMessage {
		color: lightcoral;
		text-transform: capitalize;
	}

	.commentNote {
		font-size: 0.75rem;
		width: 80%;
		padding: 2px;
		color: darkgrey;
		font-weight: bolder;

		@media (max-width: 750px) {
			width: 95%;
		}
	}

	input {
		margin-right: 10px;
	}

	label {
		font-size: 1rem;
	}
`;

const PODNote = styled.div`
	margin: 20px 0;
	padding: 15px;
	border: 1px solid #f0c14b;
	background-color: #fff8e1;
	border-radius: 5px;
	color: #333;
	font-size: 0.9rem;
	font-weight: bold;
	line-height: 1.4;
`;

const ShippingOptionRow = styled.div`
	display: flex;
	width: 100%;
	flex-wrap: wrap;
	gap: 10px; // Add gap between columns

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

const ShippingOptionWrapper = styled.div`
	flex: 1; // Evenly distribute space among children
	min-width: 200px; // Minimum width to prevent collapsing
	display: flex;
	flex-direction: column;

	@media (max-width: 768px) {
		width: 100%;
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
	background: ${(props) => (props.disabled ? "#ccc" : "black")};
	color: ${(props) => (props.disabled ? "#666" : "white")};
	border: none;
	font-size: 14px;
	transition: 0.3s;
	width: 25%;
	border-radius: 5px;
	cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
	&:hover {
		background: ${(props) => (props.disabled ? "#ccc" : "#005f4e")};
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

const WarningMessage = styled.div`
	color: red;
	font-weight: bold;
	margin-top: 10px;
	font-size: 14px;
`;
