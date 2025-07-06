/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  Production build – wallet + Hosted Fields + Pay Now
 *******************************************************************/
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import styled from "styled-components";
import { Spin } from "antd";
import axios from "axios";
import {
	PayPalScriptProvider,
	PayPalButtons,
	PayPalHostedFieldsProvider,
	PayPalHostedField,
	usePayPalHostedFields,
	usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

/* ------------------------------------------------------------------ */
const API = process.env.REACT_APP_API_URL;
const IS_PROD =
	(process.env.REACT_APP_NODE_ENV || "").toUpperCase() === "PRODUCTION";
const CLIENT_ID = IS_PROD
	? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
	: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;
/* ------------------------------------------------------------------ */

export default function PayPalCheckout({
	orderData,
	authToken,
	onLoading = () => {},
	onError = () => {},
}) {
	const [clientToken, setClientToken] = useState(null);
	const [isPending, setIsPending] = useState(false);

	/* fetch JS‑SDK client token */
	useEffect(() => {
		let alive = true;
		axios
			.post(
				`${API}/paypal/client-token`,
				{},
				{
					headers: { Authorization: `Bearer ${authToken}` },
				}
			)
			.then(({ data }) => alive && setClientToken(data.clientToken))
			.catch((err) => {
				console.error(err);
				onError("Unable to initialise PayPal");
			});
		return () => {
			alive = false;
		};
	}, [authToken, onError]);

	/* helper around axios with loader */
	const call = useCallback(
		async (method, url, data = {}) => {
			try {
				onLoading(true);
				setIsPending(true);
				const { data: resp } = await axios({
					method,
					url: `${API}${url}`,
					data,
				});
				return resp;
			} finally {
				onLoading(false);
				setIsPending(false);
			}
		},
		[onLoading]
	);

	/* create / capture */
	const invoiceRef = useRef(null);
	const createOrder = useCallback(
		() =>
			call("post", "/paypal/create-order", { orderData }).then(
				({ paypalOrderId, provisionalInvoice }) => {
					invoiceRef.current = provisionalInvoice;
					return paypalOrderId;
				}
			),
		[call, orderData]
	);

	const captureOrder = useCallback(
		(paypalOrderId) =>
			call("post", "/paypal/capture-order", {
				paypalOrderId,
				orderData,
				provisionalInvoice: invoiceRef.current,
			})
				.then(() => (window.location.href = "/dashboard"))
				.catch(() => onError("Payment could not be completed.")),
		[call, onError, orderData]
	);

	const sdkOptions = useMemo(
		() =>
			clientToken && {
				"client-id": CLIENT_ID,
				"data-client-token": clientToken,
				dataClientToken: clientToken,
				currency: "USD",
				intent: "capture",
				components: "buttons,hosted-fields",
				"enable-funding": "paypal,card",
				commit: "true",
			},
		[clientToken]
	);

	if (!sdkOptions) return <Spin />;

	return (
		<PayPalScriptProvider
			key={`pp-${IS_PROD ? "live" : "sb"}-${clientToken}`}
			options={sdkOptions}
		>
			<CardBlock
				createOrder={createOrder}
				captureOrder={captureOrder}
				isPending={isPending}
				setPending={setIsPending}
				onError={onError}
			/>

			{/* Wallet / Pay Later / Venmo */}
			<PayPalButtons
				fundingSource='paypal'
				style={{ layout: "vertical", label: "paypal" }}
				/* no disabled prop → let PayPal handle state internally */
				createOrder={createOrder}
				onApprove={({ orderID }) => captureOrder(orderID)}
				onError={() => onError("PayPal wallet error.")}
			/>
		</PayPalScriptProvider>
	);
}

/* ------------------------------------------------------------------ */
/*  CARD BLOCK                                                        */
/* ------------------------------------------------------------------ */
function CardBlock({
	createOrder,
	captureOrder,
	isPending,
	setPending,
	onError,
}) {
	const [{ isResolved }] = usePayPalScriptReducer();
	const [hostedEligible, setHostedEligible] = useState(false);
	const [fieldValidity, setFieldValidity] = useState({
		number: false,
		exp: false,
		cvv: false,
	});

	useEffect(() => {
		if (isResolved) {
			setHostedEligible(window.paypal?.HostedFields?.isEligible?.() || false);
		}
	}, [isResolved]);

	/* merge‑update each field without resetting others */
	const mergeValidity = (fields) =>
		setFieldValidity((prev) => {
			const update = { ...prev };
			if ("number" in fields) update.number = fields.number?.isValid;
			if ("expirationDate" in fields)
				update.exp = fields.expirationDate?.isValid;
			if ("cvv" in fields) update.cvv = fields.cvv?.isValid;
			return update;
		});

	if (hostedEligible) {
		const allValid = Object.values(fieldValidity).every(Boolean);

		return (
			<PayPalHostedFieldsProvider
				createOrder={createOrder}
				styles={{
					input: { "font-size": "16px", "font-family": "Inter, sans-serif" },
					"::placeholder": { color: "#A0AEC0" },
					".invalid": { color: "#E53E3E" },
					".valid": { color: "#2F855A" },
				}}
			>
				{/* visible fields */}
				<FormGroup>
					<Label>Card number</Label>
					<IframeWrap className={cls(fieldValidity.number)} id='card-number' />
				</FormGroup>
				<FlexRow>
					<FormGroup style={{ flex: 1, marginRight: 8 }}>
						<Label>Expiry</Label>
						<IframeWrap className={cls(fieldValidity.exp)} id='card-exp' />
					</FormGroup>
					<FormGroup style={{ flex: 1, marginLeft: 8 }}>
						<Label>CVV</Label>
						<IframeWrap className={cls(fieldValidity.cvv)} id='card-cvv' />
					</FormGroup>
				</FlexRow>

				{/* direct children required by the SDK */}
				<PayPalHostedField
					hostedFieldType='number'
					options={{
						selector: "#card-number",
						placeholder: "4111 1111 1111 1111",
					}}
					onInput={({ fields }) => mergeValidity(fields)}
					onChange={({ fields }) => mergeValidity(fields)}
					onValidityChange={({ fields }) => mergeValidity(fields)}
				/>
				<PayPalHostedField
					hostedFieldType='expirationDate'
					options={{ selector: "#card-exp", placeholder: "MM/YY" }}
					onInput={({ fields }) => mergeValidity(fields)}
					onChange={({ fields }) => mergeValidity(fields)}
					onValidityChange={({ fields }) => mergeValidity(fields)}
				/>
				<PayPalHostedField
					hostedFieldType='cvv'
					options={{ selector: "#card-cvv", placeholder: "***" }}
					onInput={({ fields }) => mergeValidity(fields)}
					onChange={({ fields }) => mergeValidity(fields)}
					onValidityChange={({ fields }) => mergeValidity(fields)}
				/>

				<PayNow
					disabled={!allValid || isPending}
					captureOrder={captureOrder}
					setPending={setPending}
					onError={onError}
				/>
			</PayPalHostedFieldsProvider>
		);
	}

	/* merchant not ACDC‑enabled → fallback card Smart Button */
	return (
		<PayPalButtons
			fundingSource='card'
			style={{ layout: "vertical", label: "pay", height: 45 }}
			createOrder={createOrder}
			onApprove={({ orderID }) => captureOrder(orderID)}
			onError={() => onError("Card payment error.")}
		/>
	);
}

/* ------------------------------------------------------------------ */
function PayNow({ disabled, captureOrder, setPending, onError }) {
	const hostedFields = usePayPalHostedFields();

	const handleClick = async () => {
		if (!hostedFields?.submit) return;
		try {
			setPending(true);
			const { orderId } = await hostedFields.submit({
				contingencies: ["3D_SECURE"],
			});
			await captureOrder(orderId);
		} catch {
			onError("Card payment error.");
		} finally {
			setPending(false);
		}
	};

	return (
		<PayNowButton onClick={handleClick} disabled={disabled}>
			Pay Now
		</PayNowButton>
	);
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                            */
/* ------------------------------------------------------------------ */
const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	margin-bottom: 14px;
`;
const Label = styled.label`
	font-size: 0.85rem;
	color: #4a5568;
	margin-bottom: 6px;
`;
const IframeWrap = styled.div`
	height: 46px;
	border: 1px solid #cbd5e0;
	border-radius: 6px;
	padding: 10px 12px;
	display: flex;
	align-items: center;
	transition: border-color 0.2s;

	&.valid {
		border-color: #38a169;
	}
	&.invalid {
		border-color: #e53e3e;
	}
`;
const FlexRow = styled.div`
	display: flex;
`;
const PayNowButton = styled.button`
	width: 100%;
	height: 45px;
	background: #1a202c;
	color: #fff;
	border: none;
	border-radius: 6px;
	font-size: 0.95rem;
	font-weight: 600;
	margin: 12px 0; /* space above & below */
	cursor: pointer;
	transition: background 0.2s;

	&:disabled {
		background: #a0aec0;
		cursor: not-allowed;
	}
	&:hover:enabled {
		background: #2d3748;
	}
`;
/* helper */
const cls = (v) => (v ? "valid" : "invalid");
