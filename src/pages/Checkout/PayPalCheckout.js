/*******************************************************************
 *  src/pages/Checkout/PayPalCheckout.js
 *  ‑‑ Wallet + hosted Card fields (no redirect) – July 2025 build
 *******************************************************************/
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spin } from "antd";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/* ------------------------------------------------------------------ */

const API = process.env.REACT_APP_API_URL; // back‑end base
const NODE_ENV = (process.env.REACT_APP_NODE_ENV || "").toUpperCase();
const CLIENT_ID =
	NODE_ENV === "PRODUCTION"
		? process.env.REACT_APP_PAYPAL_CLIENT_ID_LIVE
		: process.env.REACT_APP_PAYPAL_CLIENT_ID_SANDBOX;

/* ------------------------------------------------------------------ */

export default function PayPalCheckout({
	orderData, // clean order payload
	authToken, // if you need Bearer auth (remove header if not)
	onLoading, // fn(bool)   – toggle parent spinner
	onError, // fn(msg)
}) {
	const [clientToken, setClientToken] = useState(null);
	const invoiceRef = useRef(null); // holds provisionalInvoice returned by /create‑order

	/* ------------ 1. Get JS‑SDK client token ---------------------- */
	useEffect(() => {
		let mounted = true;
		axios
			.post(
				`${API}/paypal/client-token`,
				{},
				{ headers: { Authorization: `Bearer ${authToken}` } }
			)
			.then(({ data }) => mounted && setClientToken(data.clientToken))
			.catch((e) => {
				console.error(e);
				onError("Unable to initialise PayPal");
			});
		return () => (mounted = false);
	}, [authToken, onError]);

	/* ------------ helper to call our API with loader -------------- */
	const call = useCallback(
		async (method, url, data = {}) => {
			try {
				onLoading?.(true);
				const { data: resp } = await axios({
					method,
					url: `${API}${url}`,
					data,
				});
				return resp;
			} finally {
				onLoading?.(false);
			}
		},
		[onLoading]
	);

	if (!clientToken) return <Spin />;

	/* ------------ create & capture helpers (shared) --------------- */
	const createOrder = () =>
		call("post", "/paypal/create-order", { orderData }).then(
			({ paypalOrderId, provisionalInvoice }) => {
				invoiceRef.current = provisionalInvoice;
				return paypalOrderId; // PayPal SDK needs only the ID
			}
		);

	const captureOrder = (paypalOrderId) =>
		call("post", "/paypal/capture-order", {
			paypalOrderId,
			orderData,
			provisionalInvoice: invoiceRef.current,
		})
			.then(() => (window.location.href = "/dashboard"))
			.catch((e) => {
				console.error(e);
				onError(typeof e === "string" ? e : "Payment could not be completed.");
			});

	/* ------------ Render ------------------------------------------------ */
	return (
		<PayPalScriptProvider
			options={{
				"client-id": CLIENT_ID,
				"data-client-token": clientToken,
				currency: "USD",
				intent: "capture",
				components: "buttons", // card fields auto‑included
				"enable-funding": "card,paypal",
			}}
		>
			{/* Wallet / Venmo / Pay Later */}
			<PayPalButtons
				fundingSource='paypal'
				style={{ layout: "vertical", label: "paypal" }}
				createOrder={createOrder}
				onApprove={(data) => captureOrder(data.orderID)}
				onError={(err) => {
					console.error(err);
					onError("PayPal wallet error.");
				}}
			/>

			{/* Card –   Advanced Credit / Debit  (hosted fields, no redirect) */}
			<PayPalButtons
				fundingSource='card'
				style={{ layout: "vertical", label: "pay" }}
				createOrder={createOrder}
				onApprove={(data) => captureOrder(data.orderID)}
				onError={(err) => {
					console.error(err);
					onError("Card payment error.");
				}}
			/>
		</PayPalScriptProvider>
	);
}
