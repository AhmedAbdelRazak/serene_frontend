/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  – Wallet + Hosted Card Fields (July 2025, production‑ready)
 *******************************************************************/
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Spin } from "antd";
import axios from "axios";
import {
	PayPalScriptProvider,
	PayPalButtons,
	PayPalHostedFieldsProvider,
	PayPalHostedField,
} from "@paypal/react-paypal-js";

/* ------------------------------------------------------------------ */
/*  1.  Environment helpers                                           */
/* ------------------------------------------------------------------ */
const API = process.env.REACT_APP_API_URL;
const IS_PROD =
	(process.env.REACT_APP_NODE_ENV || "").toUpperCase() === "PRODUCTION";
const CLIENT_ID = IS_PROD
	? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
	: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

/* ------------------------------------------------------------------ */
/*  2.  Component                                                     */
/* ------------------------------------------------------------------ */
export default function PayPalCheckout({
	orderData,
	authToken,
	onLoading = () => {},
	onError = () => {},
}) {
	const [clientToken, setClientToken] = useState(null);
	const [isPending, setIsPending] = useState(false);
	const [cardValid, setCardValid] = useState(false);
	const invoiceRef = useRef(null);

	/* ------------ 3. Fetch client‑token ---------------------------- */
	useEffect(() => {
		let alive = true;
		axios
			.post(
				`${API}/paypal/client-token`,
				{},
				{ headers: { Authorization: `Bearer ${authToken}` } }
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

	/* ------------ 4. Axios helper w/ loader ------------------------ */
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

	/* ------------ 5. Create & Capture helpers --------------------- */
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
				.catch((e) => {
					console.error(e);
					onError(
						typeof e === "string" ? e : "Payment could not be completed."
					);
				}),
		[call, onError, orderData]
	);

	/* ------------ 6. SDK options (memoised) ------------------------ */
	const sdkOptions = useMemo(
		() =>
			clientToken && {
				"client-id": CLIENT_ID,
				"data-client-token": clientToken, // query‑string for the SDK script
				dataClientToken: clientToken, // ✅ passes react‑paypal‑js validator
				currency: "USD",
				intent: "capture",
				components: "buttons,hosted-fields",
				"enable-funding": "paypal,card",
				commit: "true",
			},
		[clientToken]
	);

	if (!sdkOptions) return <Spin />;

	/* ----------------------------------------------------------------
     7. Render
     ---------------------------------------------------------------- */
	return (
		<PayPalScriptProvider
			options={sdkOptions}
			key={`pp-sdk-${IS_PROD ? "live" : "sb"}-${clientToken}`}
		>
			{/* ---------- A. Wallet / Pay Later / Venmo ------------------- */}
			<PayPalButtons
				fundingSource='paypal'
				disabled={isPending}
				style={{ layout: "vertical", label: "paypal" }}
				createOrder={createOrder}
				onApprove={({ orderID }) => captureOrder(orderID)}
				onError={(err) => {
					console.error(err);
					onError("PayPal wallet error.");
				}}
			/>

			{/* ---------- B. Card – Hosted Fields ------------------------- */}
			<PayPalHostedFieldsProvider createOrder={createOrder}>
				<div
					style={{
						marginTop: 24,
						border: "1px solid #ccc",
						padding: 16,
						borderRadius: 8,
					}}
				>
					<label htmlFor='card-number'>Card number</label>
					<div id='card-number' style={{ minHeight: 38, marginBottom: 12 }} />

					<label htmlFor='card-exp'>Expiry</label>
					<div id='card-exp' style={{ minHeight: 38, marginBottom: 12 }} />

					<label htmlFor='card-cvv'>CVV</label>
					<div id='card-cvv' style={{ minHeight: 38 }} />
				</div>

				<PayPalHostedField
					hostedFieldType='number'
					options={{
						selector: "#card-number",
						placeholder: "4111 1111 1111 1111",
					}}
					onValidityChange={({ fields }) =>
						setCardValid(
							fields.number?.isValid &&
								fields.cvv?.isValid &&
								fields.expirationDate?.isValid
						)
					}
				/>
				<PayPalHostedField
					hostedFieldType='expirationDate'
					options={{ selector: "#card-exp", placeholder: "MM/YY" }}
				/>
				<PayPalHostedField
					hostedFieldType='cvv'
					options={{ selector: "#card-cvv", placeholder: "***" }}
				/>

				<PayPalButtons
					fundingSource='card'
					style={{ layout: "vertical", label: "pay" }}
					disabled={!cardValid || isPending}
					createOrder={createOrder}
					onApprove={({ orderID }) => captureOrder(orderID)}
					onError={(err) => {
						console.error(err);
						onError("Card payment error.");
					}}
				/>
			</PayPalHostedFieldsProvider>
		</PayPalScriptProvider>
	);
}
